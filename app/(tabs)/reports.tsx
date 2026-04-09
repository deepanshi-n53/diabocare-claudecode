import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';
import { getReadingsForDays } from '../../utils/storage';
import {
  getLast7Days,
  getLast30Days,
  getDayLabel,
  getShortDate,
  getBloodSugarStatus,
  getStatusColor,
  getStatusLabel,
  formatDateTime,
} from '../../utils/helpers';
import { BloodSugarReading } from '../../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

type Range = '7d' | '30d';

interface DayAvg {
  date: string;
  label: string;
  avg: number | null;
}

export default function ReportsScreen() {
  const [range, setRange] = useState<Range>('7d');
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [dayData, setDayData] = useState<DayAvg[]>([]);

  const loadData = useCallback(async () => {
    const days = range === '7d' ? 7 : 30;
    const data = await getReadingsForDays(days);
    setReadings(data);

    const dayList = range === '7d' ? getLast7Days() : getLast30Days();
    const computed: DayAvg[] = dayList.map((dateStr) => {
      const dayReadings = data.filter((r) => r.timestamp.startsWith(dateStr));
      const avg =
        dayReadings.length > 0
          ? Math.round(
              dayReadings.reduce((s, r) => s + r.value, 0) / dayReadings.length
            )
          : null;
      return {
        date: dateStr,
        label: range === '7d' ? getDayLabel(dateStr) : getShortDate(dateStr),
        avg,
      };
    });
    setDayData(computed);
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Stats
  const values = readings.map((r) => r.value);
  const avg =
    values.length > 0
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : null;
  const highest = values.length > 0 ? Math.max(...values) : null;
  const lowest = values.length > 0 ? Math.min(...values) : null;
  const inRange = values.filter((v) => v >= 70 && v <= 140).length;
  const inRangePct =
    values.length > 0 ? Math.round((inRange / values.length) * 100) : null;

  const hasData = readings.length > 0;
  const daysWithData = dayData.filter((d) => d.avg !== null).length;
  const showChart = daysWithData >= 2;

  // Build gifted-charts data — only days that have readings
  const chartPoints = dayData
    .filter((d) => d.avg !== null)
    .map((d) => ({
      value: d.avg as number,
      label: d.label,
      dataPointColor: getStatusColor(getBloodSugarStatus(d.avg as number)),
    }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="bg-white px-5 py-4 border-b border-gray-100">
          <Text className="text-2xl font-bold text-gray-900">Reports</Text>
          <Text className="text-gray-500 text-sm mt-0.5">
            Blood sugar trends and history
          </Text>
        </View>

        <View className="px-4 pt-4">
          {/* Range Toggle */}
          <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-4">
            {(['7d', '30d'] as Range[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  range === r ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    range === r ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {hasData ? (
            <>
              {/* Stat Cards */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-gray-400 text-xs mb-1">Average</Text>
                  <Text className="text-2xl font-bold text-blue-600">{avg}</Text>
                  <Text className="text-gray-400 text-xs">mg/dL</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-gray-400 text-xs mb-1">Highest</Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: getStatusColor(getBloodSugarStatus(highest!)) }}
                  >
                    {highest}
                  </Text>
                  <Text className="text-gray-400 text-xs">mg/dL</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl shadow-sm p-4 items-center">
                  <Text className="text-gray-400 text-xs mb-1">Lowest</Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: getStatusColor(getBloodSugarStatus(lowest!)) }}
                  >
                    {lowest}
                  </Text>
                  <Text className="text-gray-400 text-xs">mg/dL</Text>
                </View>
              </View>

              {/* In Range */}
              <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-700 font-semibold text-sm">
                    Time in Target Range (70–140 mg/dL)
                  </Text>
                  <Text
                    className="text-base font-bold"
                    style={{
                      color:
                        (inRangePct ?? 0) >= 70
                          ? '#16a34a'
                          : (inRangePct ?? 0) >= 50
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  >
                    {inRangePct}%
                  </Text>
                </View>
                <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-3 rounded-full"
                    style={{
                      width: `${inRangePct ?? 0}%`,
                      backgroundColor:
                        (inRangePct ?? 0) >= 70
                          ? '#16a34a'
                          : (inRangePct ?? 0) >= 50
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  />
                </View>
                <Text className="text-gray-400 text-xs mt-1">
                  {inRange} of {values.length} readings in range
                </Text>
              </View>

              {/* Chart */}
              {showChart ? (
                <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                  <Text className="text-gray-800 font-semibold text-sm mb-3">
                    Blood Sugar Trend (Daily Average)
                  </Text>
                  <LineChart
                    data={chartPoints}
                    width={SCREEN_WIDTH - 80}
                    height={180}
                    color="#2563eb"
                    thickness={2.5}
                    dataPointsColor="#2563eb"
                    dataPointsRadius={4}
                    startFillColor="#dbeafe"
                    endFillColor="#ffffff"
                    areaChart
                    curved
                    hideDataPoints={false}
                    showVerticalLines
                    verticalLinesColor="#f3f4f6"
                    xAxisColor="#e5e7eb"
                    yAxisColor="#e5e7eb"
                    xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 10 }}
                    yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
                    noOfSections={5}
                    rulesColor="#f3f4f6"
                    rulesType="solid"
                    yAxisLabelSuffix=""
                    maxValue={
                      chartPoints.length > 0
                        ? Math.ceil(Math.max(...chartPoints.map((p) => p.value)) / 50) * 50 + 50
                        : 300
                    }
                    // Target range reference lines
                    referenceLine1={{
                      value: 140,
                      lineConfig: {
                        color: '#fbbf24',
                        thickness: 1,
                        dashWidth: 4,
                        dashGap: 3,
                        labelText: '140',
                        labelTextStyle: { color: '#fbbf24', fontSize: 9 },
                      },
                    }}
                    referenceLine2={{
                      value: 70,
                      lineConfig: {
                        color: '#86efac',
                        thickness: 1,
                        dashWidth: 4,
                        dashGap: 3,
                        labelText: '70',
                        labelTextStyle: { color: '#86efac', fontSize: 9 },
                      },
                    }}
                  />
                  {/* Legend */}
                  <View className="flex-row items-center gap-4 px-2 mt-2">
                    <View className="flex-row items-center gap-1">
                      <View className="w-5 h-0.5 bg-blue-600 rounded" />
                      <Text className="text-gray-500 text-xs">Daily avg</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <View className="w-5 h-0.5 bg-yellow-400 rounded" />
                      <Text className="text-gray-500 text-xs">Upper limit (140)</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <View className="w-5 h-0.5 bg-green-300 rounded" />
                      <Text className="text-gray-500 text-xs">Lower limit (70)</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="bg-white rounded-2xl shadow-sm p-6 mb-4 items-center">
                  <Text className="text-2xl mb-2">📉</Text>
                  <Text className="text-gray-500 text-sm text-center">
                    Need readings on at least 2 days to show a trend chart.{'\n'}
                    Keep logging to see your progress!
                  </Text>
                </View>
              )}

              {/* Day-by-day breakdown */}
              <View className="bg-white rounded-2xl shadow-sm p-5 mb-4">
                <Text className="text-gray-800 font-semibold text-base mb-3">
                  Daily Breakdown
                </Text>
                {dayData.map((day, index) => (
                  <View
                    key={day.date}
                    className={`flex-row items-center py-2.5 ${
                      index < dayData.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <Text className="text-gray-500 text-sm w-12">{day.label}</Text>
                    <View className="flex-1 mx-3">
                      {day.avg !== null ? (
                        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <View
                            className="h-2 rounded-full"
                            style={{
                              width: `${Math.min((day.avg / 300) * 100, 100)}%`,
                              backgroundColor: getStatusColor(
                                getBloodSugarStatus(day.avg)
                              ),
                            }}
                          />
                        </View>
                      ) : (
                        <View className="h-2 bg-gray-100 rounded-full" />
                      )}
                    </View>
                    {day.avg !== null ? (
                      <Text
                        className="text-sm font-semibold w-16 text-right"
                        style={{
                          color: getStatusColor(getBloodSugarStatus(day.avg)),
                        }}
                      >
                        {day.avg} mg/dL
                      </Text>
                    ) : (
                      <Text className="text-gray-300 text-xs w-16 text-right">
                        No data
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Reading History */}
              <View className="bg-white rounded-2xl shadow-sm p-5">
                <Text className="text-gray-800 font-semibold text-base mb-3">
                  Reading History
                </Text>
                {readings.slice(0, 20).map((reading, index) => {
                  const status = getBloodSugarStatus(reading.value);
                  return (
                    <View
                      key={reading.id}
                      className={`flex-row items-center py-3 ${
                        index < Math.min(readings.length, 20) - 1
                          ? 'border-b border-gray-100'
                          : ''
                      }`}
                    >
                      <View
                        style={{ backgroundColor: `${getStatusColor(status)}20` }}
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      >
                        <Text
                          style={{ color: getStatusColor(status), fontSize: 11 }}
                          className="font-bold"
                        >
                          {reading.value}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium text-sm">
                          {reading.value} mg/dL
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {formatDateTime(reading.timestamp)} ·{' '}
                          {reading.mealTiming === 'before' ? 'Before' : 'After'} meal
                        </Text>
                      </View>
                      <View
                        style={{ backgroundColor: `${getStatusColor(status)}18` }}
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
                })}
                {readings.length > 20 && (
                  <Text className="text-center text-gray-400 text-xs mt-3">
                    Showing latest 20 of {readings.length} readings
                  </Text>
                )}
              </View>
            </>
          ) : (
            <View className="bg-white rounded-2xl shadow-sm p-8 items-center">
              <Text className="text-5xl mb-4">📊</Text>
              <Text className="text-gray-700 font-semibold text-base mb-2 text-center">
                No Data Yet
              </Text>
              <Text className="text-gray-400 text-sm text-center leading-6">
                Start logging your blood sugar readings on the Log tab.
                Your charts and statistics will appear here once you have data.
              </Text>
              <View className="mt-4 bg-blue-50 rounded-xl p-3 w-full">
                <Text className="text-blue-700 text-xs text-center">
                  💡 Tip: Log at least 2 days of readings to see your trend chart
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
