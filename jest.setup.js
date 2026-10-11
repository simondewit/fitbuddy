// Native opslag bestaat niet in de testomgeving; vervang die door een mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
