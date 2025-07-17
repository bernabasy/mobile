import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/Colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
    color: COLORS.darkGray,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.darkGray,
  },
  button: {
    backgroundColor: COLORS.accentTeal,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: COLORS.primaryGreen,
    fontSize: 16,
    textAlign: 'center',
  },
});