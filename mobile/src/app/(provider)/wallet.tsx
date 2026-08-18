import React from 'react';
import { Redirect } from 'expo-router';

export default function WalletRedirect() {
  return <Redirect href="/(provider)/(tabs)/earnings" />;
}
