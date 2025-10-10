// src/navigation/AppNavigator.js
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../hooks/useAuth';

// Screens de Usuario
import CreateReportScreen from '../screens/user/CreateReportScreen';
import HomeScreen from '../screens/user/HomeScreen';
import MapScreen from '../screens/user/MapScreen';
import MyReportsScreen from '../screens/user/MyReportsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

// Screens de Admin (las crearemos después)
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ModerateReportsScreen from '../screens/admin/ModerateReportsScreen';
import StatisticsScreen from '../screens/admin/StatisticsScreen';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tabs para usuario normal
function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'CreateReportTab') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{ title: 'Mapa' }}
      />
      <Tab.Screen
        name="CreateReportTab"
        component={CreateReportScreen}
        options={{ title: 'Reportar' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// Tabs para administrador
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'ModerateTab') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'UsersTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'StatsTab') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="ModerateTab"
        component={ModerateReportsScreen}
        options={{ title: 'Moderar' }}
      />
      <Tab.Screen
        name="UsersTab"
        component={UsersManagementScreen}
        options={{ title: 'Usuarios' }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatisticsScreen}
        options={{ title: 'Estadísticas' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAdmin } = useAuth();

  return (
    <Stack.Navigator>
      {isAdmin ? (
        <Stack.Screen
          name="AdminMain"
          component={AdminTabs}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="UserMain"
          component={UserTabs}
          options={{ headerShown: false }}
        />
      )}
      
      {/* Pantallas compartidas */}
      <Stack.Screen
        name="CreateReport"
        component={CreateReportScreen}
        options={{
          title: 'Crear Reporte',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      
      <Stack.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{
          title: 'Mis Reportes',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}