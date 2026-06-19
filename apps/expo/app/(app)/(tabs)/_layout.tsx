import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { t } from "@/lib/i18n";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.today,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "house.fill",
                android: "home",
                web: "home",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: t.nav.equipment,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "list.bullet",
                android: "list",
                web: "list",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-equipment"
        options={{
          title: t.nav.myEquipment,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "tray.full",
                android: "inbox",
                web: "inbox",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: t.nav.rooms,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "door.left.hand.open",
                android: "meeting_room",
                web: "meeting_room",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="auth"
        options={{
          title: t.nav.admin,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "person.crop.circle",
                android: "person",
                web: "person",
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
