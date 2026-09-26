import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@vepari/design-system';
import { getApiClient } from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';

interface Props {
  businessId: string;
}

interface Member {
  memberId: string;
  userId: string;
  name: string;
  phone: string;
  role: 'OWNER' | 'MANAGER' | 'STAFF';
  joinedAt: string;
}

const ROLE_LABEL: Record<Member['role'], string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

const ROLE_COLOR: Record<Member['role'], string> = {
  OWNER: '#92400E',
  MANAGER: '#1E40AF',
  STAFF: '#374151',
};

const ROLE_BG: Record<Member['role'], string> = {
  OWNER: '#FEF3C7',
  MANAGER: '#DBEAFE',
  STAFF: '#F3F4F6',
};

export default function TeamScreen({ businessId }: Props): React.JSX.Element {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRole, setMyRole] = useState<Member['role']>('STAFF');
  const [myMemberId, setMyMemberId] = useState('');

  const [inviteVisible, setInviteVisible] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'MANAGER' | 'STAFF'>('STAFF');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ms, me] = await Promise.all([
        getApiClient().listTeamMembers(businessId),
        getApiClient().getMe(),
      ]);
      setMembers(ms);
      const mine = ms.find(m => m.phone === me.phone);
      if (mine) { setMyRole(mine.role); setMyMemberId(mine.memberId); }
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleRefresh = () => { setRefreshing(true); void load(); };

  const handleInvite = async () => {
    const phone = invitePhone.trim();
    if (!phone) { Alert.alert('Phone required', 'Enter a phone number.'); return; }
    setInviting(true);
    try {
      await getApiClient().inviteTeamMember(businessId, phone, inviteRole);
      setInviteVisible(false);
      setInvitePhone('');
      setInviteRole('STAFF');
      void load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not add member.';
      Alert.alert('Error', msg);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = (member: Member) => {
    if (myRole !== 'OWNER') return;
    if (member.role === 'OWNER') return;
    Alert.alert('Change Role', `Update ${member.name}'s role:`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Make Manager',
        onPress: async () => {
          try {
            await getApiClient().updateTeamMemberRole(businessId, member.memberId, 'MANAGER');
            void load();
          } catch { Alert.alert('Error', 'Could not update role.'); }
        },
      },
      {
        text: 'Make Staff',
        onPress: async () => {
          try {
            await getApiClient().updateTeamMemberRole(businessId, member.memberId, 'STAFF');
            void load();
          } catch { Alert.alert('Error', 'Could not update role.'); }
        },
      },
    ]);
  };

  const handleRemove = (member: Member) => {
    if (member.memberId === myMemberId) return;
    if (member.role === 'OWNER') return;
    Alert.alert('Remove Member', `Remove ${member.name} from the team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await getApiClient().removeTeamMember(businessId, member.memberId);
            void load();
          } catch { Alert.alert('Error', 'Could not remove member.'); }
        },
      },
    ]);
  };

  const canInvite = myRole === 'OWNER' || myRole === 'MANAGER';

  const renderMember = ({ item }: { item: Member }) => {
    const initials = item.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const isMe = item.memberId === myMemberId;
    const canEdit = myRole === 'OWNER' && item.role !== 'OWNER';

    return (
      <View style={styles.memberRow}>
        <View style={[styles.avatar, { backgroundColor: ROLE_BG[item.role] }]}>
          <Text style={[styles.avatarText, { color: ROLE_COLOR[item.role] }]}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}{isMe ? ' (You)' : ''}</Text>
          <Text style={styles.memberPhone}>{item.phone}</Text>
        </View>
        <View style={styles.memberActions}>
          <TouchableOpacity
            onPress={() => handleRoleChange(item)}
            style={[styles.roleBadge, { backgroundColor: ROLE_BG[item.role] }]}
            activeOpacity={canEdit ? 0.7 : 1}
          >
            <Text style={[styles.roleText, { color: ROLE_COLOR[item.role] }]}>
              {ROLE_LABEL[item.role]}
            </Text>
          </TouchableOpacity>
          {canEdit && !isMe && (
            <TouchableOpacity onPress={() => handleRemove(item)} style={styles.removeBtn} activeOpacity={0.7}>
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.brown} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team</Text>
        {canInvite && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setInviteVisible(true)} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={m => m.memberId}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brown} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No team members yet.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Modal visible={inviteVisible} animationType="slide" transparent onRequestClose={() => setInviteVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Team Member</Text>
              <TouchableOpacity onPress={() => { setInviteVisible(false); setInvitePhone(''); }} activeOpacity={0.7}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={invitePhone}
              onChangeText={setInvitePhone}
              placeholder="+91XXXXXXXXXX"
              placeholderTextColor={Colors.muted}
              keyboardType="phone-pad"
              autoFocus
            />

            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.roleRow}>
              {(['STAFF', 'MANAGER'] as const).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, inviteRole === r && styles.roleChipActive]}
                  onPress={() => setInviteRole(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleChipText, inviteRole === r && styles.roleChipTextActive]}>
                    {ROLE_LABEL[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.inviteBtn} onPress={() => { void handleInvite(); }} disabled={inviting} activeOpacity={0.8}>
              {inviting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.inviteBtnText}>Add Member</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ivory },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  addBtn: {
    backgroundColor: Colors.brown, borderRadius: Radius.md,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
  },
  addBtnText: { color: Colors.white, fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  list: { padding: Spacing[4], paddingBottom: Spacing[10] },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.bold },
  memberInfo: { flex: 1 },
  memberName: { fontSize: Typography.fontSize.base, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  memberPhone: { fontSize: Typography.fontSize.sm, color: Colors.muted, marginTop: 2 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  roleBadge: { paddingHorizontal: Spacing[2], paddingVertical: 4, borderRadius: Radius.sm },
  roleText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  removeBtn: { padding: Spacing[1] },
  removeText: { fontSize: Typography.fontSize.sm, color: Colors.error },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { fontSize: Typography.fontSize.base, color: Colors.muted },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing[5], paddingBottom: Spacing[8],
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[4] },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.brown },
  modalClose: { fontSize: Typography.fontSize.xl, color: Colors.muted },
  fieldLabel: { fontSize: Typography.fontSize.xs, color: Colors.muted, fontWeight: Typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing[2] },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base, color: Colors.brown, marginBottom: Spacing[4],
  },
  roleRow: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[5] },
  roleChip: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing[3],
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
  },
  roleChipActive: { backgroundColor: Colors.brown, borderColor: Colors.brown },
  roleChipText: { fontSize: Typography.fontSize.sm, color: Colors.brown, fontWeight: Typography.fontWeight.medium },
  roleChipTextActive: { color: Colors.white, fontWeight: Typography.fontWeight.semibold },
  inviteBtn: {
    backgroundColor: Colors.brown, borderRadius: Radius.md,
    paddingVertical: Spacing[4], alignItems: 'center',
  },
  inviteBtnText: { color: Colors.white, fontSize: Typography.fontSize.base, fontWeight: Typography.fontWeight.semibold },
});
