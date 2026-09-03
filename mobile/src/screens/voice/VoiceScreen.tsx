import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '@vepari/design-system';
import {
  startRecording,
  stopRecording,
  getRecorderState,
  resetRecorder,
  checkMicPermission,
  requestMicPermission,
  transcribeAudioFile,
  speakText,
} from '@/voice';
import type { SupportedLanguage } from '@/voice';
import { getApiClient } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'bn-IN', label: 'বাংলা' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
  { code: 'gu-IN', label: 'ગુજરાતી' },
];

interface Props {
  businessId: string;
}

export default function VoiceScreen({ businessId }: Props): React.JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('hi-IN');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [recording, pulseAnim]);

  const addMessage = useCallback((role: Message['role'], text: string) => {
    const msg: Message = { id: Date.now().toString(), role, text, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleMicPress = useCallback(async () => {
    if (thinking) return;

    // Stop recording and process
    if (getRecorderState() === 'recording') {
      const audioPath = await stopRecording();
      resetRecorder();
      setRecording(false);
      if (!audioPath) return;

      let transcript = '';
      try {
        setThinking(true);
        const result = await transcribeAudioFile(audioPath, language);
        transcript = result.transcript.trim();
      } catch {
        addMessage('assistant', 'Sorry, I could not understand the audio. Please try again.');
        setThinking(false);
        return;
      }

      if (!transcript) {
        addMessage('assistant', 'I did not catch that. Please speak clearly and try again.');
        setThinking(false);
        return;
      }

      addMessage('user', transcript);

      try {
        const { reply } = await getApiClient().chatWithBusiness(businessId, transcript);
        addMessage('assistant', reply);
        void speakText(reply, language);
      } catch {
        addMessage('assistant', 'Unable to get a response right now. Please try again.');
      } finally {
        setThinking(false);
      }
      return;
    }

    // Start recording
    let permission = await checkMicPermission();
    if (permission === 'denied') permission = await requestMicPermission();
    if (permission === 'blocked') {
      Alert.alert('Microphone Required', 'Please enable microphone access in Settings.');
      return;
    }
    if (permission !== 'granted') return;

    try {
      await startRecording();
      setRecording(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start recording.';
      Alert.alert('Error', msg);
    }
  }, [businessId, language, thinking, addMessage]);

  const selectedLang = LANGUAGES.find(l => l.code === language);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Voice Assistant</Text>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setShowLangPicker(v => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.langBtnText}>{selectedLang?.label ?? 'EN'}</Text>
          <Text style={styles.langChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* Language picker */}
      {showLangPicker && (
        <View style={styles.langPicker}>
          {LANGUAGES.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langOption, language === l.code && styles.langOptionActive]}
              onPress={() => { setLanguage(l.code); setShowLangPicker(false); }}
            >
              <Text style={[styles.langOptionText, language === l.code && styles.langOptionTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !recording && !thinking && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎙️</Text>
            <Text style={styles.emptyTitle}>Ask Vepari AI</Text>
            <Text style={styles.emptyHint}>Tap the mic and ask about your sales, profits, stock, or customers.</Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map(s => (
                <View key={s} style={styles.suggestionChip}>
                  <Text style={styles.suggestionText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {messages.map(msg => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
          >
            {msg.role === 'assistant' && (
              <Text style={styles.bubbleLabel}>Vepari AI</Text>
            )}
            <Text style={[styles.bubbleText, msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
              {msg.text}
            </Text>
            <Text style={styles.bubbleTime}>
              {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}

        {thinking && (
          <View style={[styles.bubble, styles.bubbleAssistant, styles.thinkingBubble]}>
            <Text style={styles.bubbleLabel}>Vepari AI</Text>
            <ActivityIndicator color={Colors.brown} size="small" />
          </View>
        )}
      </ScrollView>

      {/* Mic button */}
      <View style={styles.footer}>
        {recording && (
          <Text style={styles.recordingHint}>Listening… tap to send</Text>
        )}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.micBtn, recording && styles.micBtnActive, thinking && styles.micBtnDisabled]}
            onPress={() => void handleMicPress()}
            activeOpacity={0.85}
            disabled={thinking}
          >
            <Text style={styles.micEmoji}>{recording ? '⏹' : '🎙️'}</Text>
          </TouchableOpacity>
        </Animated.View>
        {messages.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setMessages([])}
            activeOpacity={0.7}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const SUGGESTIONS = [
  '"Aaj kitna hua?"',
  '"Who owes me money?"',
  '"Low stock items?"',
  '"Today\'s profit?"',
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[4], paddingBottom: Spacing[2],
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1],
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  langBtnText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  langChevron: { color: Colors.muted, fontSize: 10 },
  langPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2],
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[2],
  },
  langOption: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[1],
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  langOptionActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  langOptionText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
  langOptionTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  messages: { flex: 1 },
  messagesContent: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[6] },
  emptyState: { alignItems: 'center', paddingTop: Spacing[10], gap: Spacing[3] },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  emptyHint: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center', maxWidth: 260 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], justifyContent: 'center', marginTop: Spacing[2] },
  suggestionChip: {
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    borderRadius: Radius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  suggestionText: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontStyle: 'italic' },
  bubble: {
    maxWidth: '80%', borderRadius: Radius.lg, padding: Spacing[3], gap: 4, ...Shadows.sm,
  },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: Colors.brown, borderBottomRightRadius: Radius.sm },
  bubbleAssistant: { alignSelf: 'flex-start', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: Radius.sm },
  bubbleLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.semibold },
  bubbleText: { fontSize: Typography.fontSize.base, lineHeight: 22 },
  bubbleTextUser: { color: Colors.ivory },
  bubbleTextAssistant: { color: Colors.brown },
  bubbleTime: { fontSize: 10, color: Colors.muted, alignSelf: 'flex-end' },
  thinkingBubble: { paddingVertical: Spacing[4] },
  footer: { alignItems: 'center', paddingVertical: Spacing[4], gap: Spacing[2] },
  recordingHint: { fontSize: Typography.fontSize.sm, color: Colors.terra, fontWeight: Typography.fontWeight.medium },
  micBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.brown, alignItems: 'center', justifyContent: 'center',
    ...Shadows.lg,
  },
  micBtnActive: { backgroundColor: Colors.terra },
  micBtnDisabled: { opacity: 0.5 },
  micEmoji: { fontSize: 32 },
  clearBtn: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] },
  clearText: { fontSize: Typography.fontSize.sm, color: Colors.muted },
});
