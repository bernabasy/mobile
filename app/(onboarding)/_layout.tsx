import { Stack } from 'expo-router';
import React from 'react';

const _layout = () => {
    console.log("onboarding ")
    return (
          <Stack initialRouteName="chooseLanguage">
            <Stack.Screen name="chooseLanguage" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }}  />
          </Stack>
      );
}

export default _layout