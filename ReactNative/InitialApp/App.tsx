import React from 'react';
import WelcomeScreen from './Layout/WelcomeScreen/Welcome.tsx';
import { NativeRouter, Route, Routes } from 'react-router-native';
import { Text, View } from 'react-native';

function App(): React.JSX.Element {
  return (
    <NativeRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/signup" element={<View><Text>Hello</Text></View>} />
      </Routes>
    </NativeRouter>
  );
}

export default App;