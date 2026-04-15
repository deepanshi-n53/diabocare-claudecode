import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View className="items-center justify-center pt-1">
      <Ionicons name={name} size={24} color={focused ? '#2563eb' : '#9ca3af'} />
      <Text
        style={{
          fontSize: 10,
          marginTop: 2,
          color: focused ? '#2563eb' : '#9ca3af',
          fontWeight: focused ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  // Tab bar height: 60px content + device bottom inset (home indicator / nav bar)
  const tabBarHeight = 60 + insets.bottom;
  const tabBarPaddingBottom = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label={t.nav.home} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: t.nav.log,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'add-circle' : 'add-circle-outline'} focused={focused} label={t.nav.log} />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: t.nav.tests,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'flask' : 'flask-outline'} focused={focused} label={t.nav.tests} />
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: t.nav.diet,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'nutrition' : 'nutrition-outline'} focused={focused} label={t.nav.diet} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t.nav.reports,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} focused={focused} label={t.nav.reports} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.nav.settings,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} label={t.nav.settings} />
          ),
        }}
      />
    </Tabs>
  );
}
