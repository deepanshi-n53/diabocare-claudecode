import { View, Text, Modal, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  reading: number;
  type: 'critical-low' | 'critical-high';
  onDismiss: () => void;
}

export default function CriticalAlert({ reading, type, onDismiss }: Props) {
  const isCriticalLow = type === 'critical-low';

  async function handleEmergencyCall() {
    try {
      await Linking.openURL('tel:112');
    } catch {
      // ignore — device may not support phone calls
    }
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        // block back-button dismissal
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning" size={44} color="#ef4444" />
          </View>

          <Text style={styles.title}>
            {isCriticalLow
              ? 'Dangerously Low Blood Sugar'
              : 'Critically High Blood Sugar'}
          </Text>

          <Text style={styles.reading}>{reading} mg/dL</Text>

          <Text style={styles.message}>
            {isCriticalLow
              ? `Your reading of ${reading} mg/dL is critically low. Eat 15g of fast-acting carbs immediately (glucose tablets, juice, or sugar). Sit down and recheck in 15 minutes.`
              : `Your reading of ${reading} mg/dL requires immediate attention. Check for ketones if possible. Contact your doctor now.`}
          </Text>

          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissText}>I understand</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergencyCall}>
            <Ionicons name="call" size={18} color="white" />
            <Text style={styles.emergencyText}>
              {isCriticalLow ? 'Call Emergency (112)' : 'Call Doctor'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(220,38,38,0.93)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991b1b',
    textAlign: 'center',
    marginBottom: 8,
  },
  reading: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  dismissBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  dismissText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  emergencyBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emergencyText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
