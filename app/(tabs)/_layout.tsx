import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
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
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'add-circle' : 'add-circle-outline'}
              focused={focused}
              label="Log"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: 'Tests',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'flask' : 'flask-outline'}
              focused={focused}
              label="Tests"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: 'Diet',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'nutrition' : 'nutrition-outline'}
              focused={focused}
              label="Diet"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              focused={focused}
              label="Reports"
            />
          ),
        }}
      />
    </Tabs>
  );
}
