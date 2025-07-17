import { StyleSheet } from 'react-native';
import { COLORS } from '../constants/Colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  welcome: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 5,
    marginBottom: 15,
  },
  cardButton: {
    backgroundColor: COLORS.accentTeal,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cardButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});