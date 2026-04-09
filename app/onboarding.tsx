import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { saveUser } from '../utils/storage';
import { User } from '../types';

const DIABETES_TYPES: User['diabetesType'][] = [
  'Type 1',
  'Type 2',
  'Gestational',
  'Pre-diabetes',
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [diabetesType, setDiabetesType] = useState<User['diabetesType']>('Type 2');

  function handleNext() {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Required', 'Please enter your name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      handleFinish();
    }
  }

  async function handleFinish() {
    const user: User = {
      name: name.trim(),
      age: age ? parseInt(age, 10) : undefined,
      diabetesType,
      targetMin: 70,
      targetMax: 140,
      onboardingComplete: true,
    };
    await saveUser(user);
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 bg-white px-6 pt-16 pb-8">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
              <Text style={{ fontSize: 40 }}>💙</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">DiabaCare</Text>
            <Text className="text-gray-500 mt-2 text-center text-base">
              Your personal diabetes management companion
            </Text>
          </View>

          {/* Step indicator */}
          <View className="flex-row justify-center gap-2 mb-8">
            <View className={`h-2 w-10 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <View className={`h-2 w-10 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </View>

          {step === 1 && (
            <View className="flex-1">
              <Text className="text-xl font-semibold text-gray-800 mb-1">
                Welcome! Let's get started.
              </Text>
              <Text className="text-gray-500 mb-6">
                Tell us a bit about yourself so we can personalize your experience.
              </Text>

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Your Name <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
                placeholder="e.g. John Smith"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Text className="text-sm font-medium text-gray-700 mb-1">
                Age (optional)
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                placeholder="e.g. 45"
                placeholderTextColor="#9ca3af"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
              />
            </View>
          )}

          {step === 2 && (
            <View className="flex-1">
              <Text className="text-xl font-semibold text-gray-800 mb-1">
                Diabetes Type
              </Text>
              <Text className="text-gray-500 mb-6">
                Select your diabetes type. You can change this later in settings.
              </Text>

              {DIABETES_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setDiabetesType(type)}
                  className={`flex-row items-center border rounded-xl px-4 py-4 mb-3 ${
                    diabetesType === type
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      diabetesType === type ? 'border-blue-600' : 'border-gray-400'
                    }`}
                  >
                    {diabetesType === type && (
                      <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    )}
                  </View>
                  <Text
                    className={`text-base font-medium ${
                      diabetesType === type ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Navigation buttons */}
          <View className="mt-8">
            <TouchableOpacity
              onPress={handleNext}
              className="bg-blue-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white text-base font-semibold">
                {step === 2 ? 'Get Started' : 'Continue'}
              </Text>
            </TouchableOpacity>

            {step > 1 && (
              <TouchableOpacity
                onPress={() => setStep((s) => s - 1)}
                className="mt-3 items-center py-3"
              >
                <Text className="text-gray-500 text-base">Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
