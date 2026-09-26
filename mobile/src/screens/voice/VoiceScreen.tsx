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
import { useLanguage } from '@/hooks/useLanguage';
import { getSarvamVoiceCode } from '@vepari/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface Props {
  businessId: string;
}

export default function VoiceScreen({ businessId }: Props): React.JSX.Element {
  const { language: appLang, t } = useLanguage();
  // Derive the Sarvam TTS code from the app's selected language.
  // STT input uses `undefined` (auto-detect) since the user may speak any language.
  const ttsLang = getSarvamVoiceCode(appLang) as SupportedLanguage;

  const [messages, setMessages] = useState<Message[]>([]);
  const [recording, setRecording] = useState(false);
  const [thinking, setThinking] = useState(false);
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
        // STT: auto-detect language (user may speak any language)
        const result = await transcribeAudioFile(audioPath, undefined);
        transcript = result.transcript.trim();
      } catch {
        addMessage('assistant', t('status.somethingWrong'));
        setThinking(false);
        return;
      }

      if (!transcript) {
        addMessage('assistant', t('voice.tapToSpeak'));
        setThinking(false);
        return;
      }

      addMessage('user', transcript);

      try {
        const { reply } = await getApiClient().chatWithBusiness(businessId, transcript);
        addMessage('assistant', reply);
        // TTS: always speak in the user's selected app language
        void speakText(reply, ttsLang);
      } catch {
        addMessage('assistant', t('status.somethingWrong'));
      } finally {
        setThinking(false);
      }
      return;
    }

    // Start recording
    let permission = await checkMicPermission();
    if (permission === 'denied') permission = await requestMicPermission();
    if (permission === 'blocked') {
      Alert.alert(t('voice.voiceInput'), t('error.unauthorized'));
      return;
    }
    if (permission !== 'granted') return;

    try {
      await startRecording();
      setRecording(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('status.somethingWrong');
      Alert.alert(t('status.error'), msg);
    }
  }, [businessId, ttsLang, thinking, addMessage, t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('nav.voice')}</Text>
        <Text style={styles.langIndicator}>{(ttsLang.split('-')[0] ?? ttsLang).toUpperCase()}</Text>
      </View>

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
            <Text style={styles.emptyTitle}>{t('voice.askAnything')}</Text>
            <Text style={styles.emptyHint}>{t('ai.askExample')}</Text>
          </View>
        )}

        {messages.map(msg => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
          >
            {msg.role === 'assistant' && (
              <Text style={styles.bubbleLabel}>{t('ai.assistant')}</Text>
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
            <Text style={styles.bubbleLabel}>{t('ai.assistant')}</Text>
            <ActivityIndicator color={Colors.brown} size="small" />
          </View>
        )}
      </ScrollView>

      {/* Mic button */}
      <View style={styles.footer}>
        {recording && (
          <Text style={styles.recordingHint}>{t('voice.listening')}</Text>
        )}
        {thinking && !recording && (
          <Text style={styles.recordingHint}>{t('ai.thinking')}</Text>
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
        {!recording && !thinking && (
          <Text style={styles.tapHint}>{t('voice.tapToSpeak')}</Text>
        )}
        {messages.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setMessages([])}
            activeOpacity={0.7}
          >
            <Text style={styles.clearText}>{t('action.close')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[4], paddingBottom: Spacing[2],
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  langIndicator: {
    fontSize: Typography.fontSize.xs, color: Colors.muted,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: Spacing[2], paddingVertical: 2, backgroundColor: Colors.white,
  },
  messages: { flex: 1 },
  messagesContent: { padding: Spacing[4], gap: Spacing[3], paddingBottom: Spacing[6] },
  emptyState: { alignItems: 'center', paddingTop: Spacing[10], gap: Spacing[3] },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  emptyHint: { fontSize: Typography.fontSize.sm, color: Colors.muted, textAlign: 'center', maxWidth: 260 },
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
  tapHint: { fontSize: Typography.fontSize.xs, color: Colors.muted },
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
