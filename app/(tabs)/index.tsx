import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUser, getTodaysReadings, getReadings } from '../../utils/storage';
import {
  formatTime,
  formatDate,
  getBloodSugarStatus,
  getStatusColor,
  getStatusBgColor,
  getStatusLabel,
  calculateStreak,
} from '../../utils/helpers';
import { BloodSugarReading, User } from '../../types';

export default function DashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [todaysReadings, setTodaysReadings] = useState<BloodSugarReading[]>([]);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [u, readings, allReadings] = await Promise.all([
      getUser(),
      getTodaysReadings(),
      getReadings(),
    ]);
    setUser(u);
    setTodaysReadings(readings);
    setStreak(calculateStreak(allReadings.map((r) => r.timestamp)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const lastReading = todaysReadings[0] ?? null;
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-blue-600 px-5 pt-4 pb-8">
          <Text className="text-blue-100 text-sm">{dateStr}</Text>
          <Text className="text-white text-2xl font-bold mt-1">
            Hello, {user?.name ?? 'there'} 👋
          </Text>
          {user?.diabetesType && (
            <View className="mt-2 flex-row">
              <View className="bg-blue-500 rounded-full px-3 py-1">
                <Text className="text-blue-100 text-xs">{user.diabetesType}</Text>
              </View>
            </View>
          )}
        </View>

        <View className="px-4 -mt-4">
          {/* Last Reading Card */}
          <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
            <Text className="text-gray-500 text-sm font-medium mb-3">
              Latest Blood Sugar
            </Text>

            {lastReading ? (
              <View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-end">
                    <Text className="text-5xl font-bold text-gray-900">
                      {lastReading.value}
                    </Text>
                    <Text className="text-gray-500 text-base ml-1 mb-2">mg/dL</Text>
                  </View>
                  {(() => {
                    const status = getBloodSugarStatus(lastReading.value);
                    return (
                      <View
                        style={{ backgroundColor: getStatusBgColor(status) }}
                        className="rounded-full px-4 py-2"
                      >
                        <Text
                          style={{ color: getStatusColor(status) }}
                          className="font-semibold text-sm"
                        >
                          {getStatusLabel(status)}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                <View className="flex-row items-center mt-2 gap-4">
                  <Text className="text-gray-400 text-xs">
                    {formatTime(lastReading.timestamp)} ·{' '}
                    {lastReading.mealTiming === 'before' ? 'Before meal' : 'After meal'}
                  </Text>
                </View>
                {/* Range bar */}
                <View className="mt-4">
                  <View className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min((lastReading.value / 400) * 100, 100)}%`,
                        backgroundColor: getStatusColor(
                          getBloodSugarStatus(lastReading.value)
                        ),
                      }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-xs text-gray-400">0</Text>
                    <Text className="text-xs text-gray-400">Normal: 70–140</Text>
                    <Text className="text-xs text-gray-400">400</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View className="items-center py-4">
                <Text className="text-4xl mb-2">📊</Text>
                <Text className="text-gray-500 text-sm text-center">
                  No readings today yet.{'\n'}Log your first reading below.
                </Text>
              </View>
            )}
          </View>

          {/* Log Reading Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/log')}
            className="bg-blue-600 rounded-2xl py-4 items-center mb-4 flex-row justify-center gap-2"
          >
            <Ionicons name="add-circle" size={22} color="white" />
            <Text className="text-white text-base font-semibold">
              Log Blood Sugar Reading
            </Text>
          </TouchableOpacity>

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-4">
            {/* Streak */}
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
              <Text className="text-2xl">🔥</Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">{streak}</Text>
              <Text className="text-gray-500 text-xs text-center mt-0.5">Day streak</Text>
            </View>

            {/* Today's count */}
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
              <Text className="text-2xl">📋</Text>
              <Text className="text-2xl font-bold text-gray-900 mt-1">
                {todaysReadings.length}
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-0.5">
                Readings today
              </Text>
            </View>

            {/* Target range */}
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
              <Text className="text-2xl">🎯</Text>
              <Text className="text-sm font-bold text-gray-900 mt-1">70–140</Text>
              <Text className="text-gray-500 text-xs text-center mt-0.5">mg/dL target</Text>
            </View>
          </View>

          {/* Today's Readings List */}
          <View className="bg-white rounded-2xl shadow-sm p-5">
            <Text className="text-gray-800 font-semibold text-base mb-3">
              Today's Readings
            </Text>

            {todaysReadings.length === 0 ? (
              <View className="items-center py-6">
                <Text className="text-3xl mb-2">📭</Text>
                <Text className="text-gray-500 text-sm text-center">
                  No readings logged today.{'\n'}Start tracking to see your progress!
                </Text>
              </View>
            ) : (
              todaysReadings.map((reading, index) => {
                const status = getBloodSugarStatus(reading.value);
                return (
                  <View
                    key={reading.id}
                    className={`flex-row items-center py-3 ${
                      index < todaysReadings.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <View
                      style={{ backgroundColor: getStatusBgColor(status) }}
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    >
                      <Text
                        style={{ color: getStatusColor(status) }}
                        className="font-bold text-sm"
                      >
                        {reading.value}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-medium text-sm">
                        {reading.value} mg/dL
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {formatTime(reading.timestamp)} ·{' '}
                        {reading.mealTiming === 'before' ? 'Before meal' : 'After meal'}
                        {reading.insulinUnits ? ` · ${reading.insulinUnits}u insulin` : ''}
                      </Text>
                      {reading.notes ? (
                        <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                          {reading.notes}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={{ backgroundColor: getStatusBgColor(status) }}
                      className="rounded-full px-2 py-0.5"
                    >
                      <Text
                        style={{ color: getStatusColor(status) }}
                        className="text-xs font-medium"
                      >
                        {getStatusLabel(status)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Quick links */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/diet')}
              className="flex-1 bg-green-50 border border-green-100 rounded-2xl p-4 items-center"
            >
              <Text className="text-xl">🥗</Text>
              <Text className="text-green-700 font-medium text-xs mt-1">Log Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/tests')}
              className="flex-1 bg-purple-50 border border-purple-100 rounded-2xl p-4 items-center"
            >
              <Text className="text-xl">🧪</Text>
              <Text className="text-purple-700 font-medium text-xs mt-1">Lab Tests</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/reports')}
              className="flex-1 bg-orange-50 border border-orange-100 rounded-2xl p-4 items-center"
            >
              <Text className="text-xl">📈</Text>
              <Text className="text-orange-700 font-medium text-xs mt-1">Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
