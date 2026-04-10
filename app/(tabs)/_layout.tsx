import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'react-native';

const THEME = '#4A90D9';

const TAB_ICONS = {
  map:      require('../../assets/icons/tab-map.png'),
  register: require('../../assets/icons/tab-register.png'),
  shelf:    require('../../assets/icons/tab-bookshelf.png'),
  mypage:   require('../../assets/icons/tab-mypage.png'),
} as const;

export default function TabLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          },
        }}
        screenOptions={{
          tabBarActiveTintColor: THEME,
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerStyle: { backgroundColor: THEME },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'たび',
            tabBarLabel: 'たび',
            tabBarIcon: ({ focused }) => (
              <Image source={TAB_ICONS.map} style={{ width: 26, height: 26, opacity: focused ? 1 : 0.4 }} resizeMode="contain" />
            ),
            headerTitle: 'ブックマーチ',
          }}
        />
        <Tabs.Screen
          name="register"
          options={{
            title: 'とうろく',
            tabBarLabel: 'とうろく',
            tabBarIcon: ({ focused }) => (
              <Image source={TAB_ICONS.register} style={{ width: 26, height: 26, opacity: focused ? 1 : 0.4 }} resizeMode="contain" />
            ),
            headerTitle: 'とうろく',
          }}
        />
        <Tabs.Screen
          name="bookshelf"
          options={{
            title: 'ほんだな',
            tabBarLabel: 'ほんだな',
            tabBarIcon: ({ focused }) => (
              <Image source={TAB_ICONS.shelf} style={{ width: 26, height: 26, opacity: focused ? 1 : 0.4 }} resizeMode="contain" />
            ),
            headerTitle: 'ほんだな',
          }}
        />
        <Tabs.Screen
          name="mypage"
          options={{
            title: 'マイページ',
            tabBarLabel: 'マイページ',
            tabBarIcon: ({ focused }) => (
              <Image source={TAB_ICONS.mypage} style={{ width: 26, height: 26, opacity: focused ? 1 : 0.4 }} resizeMode="contain" />
            ),
            headerTitle: 'マイページ',
          }}
        />
      </Tabs>
    </>
  );
}

