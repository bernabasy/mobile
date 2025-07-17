import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/Colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.lightGray,
    marginTop: 10,
  },
});