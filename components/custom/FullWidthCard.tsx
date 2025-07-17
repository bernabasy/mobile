import { StyleSheet, View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Import from expo-linear-gradient
import { Colors } from '@/constants/Colors';

type FullWidthGradientCardProps = {
  title: string;
  subtitle: string;
  imageSource: any;
};


const FullWidthGradientCard: React.FC<FullWidthGradientCardProps>
 = ({ title, subtitle, imageSource }) => {
  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={[Colors.dark.secondary, "lightblue"]} // Example gradient colors. Customize as needed.
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
         <Image source={imageSource} style={styles.image} resizeMode="contain" />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    overflow: 'hidden', // To clip the shadow
    marginBottom: 20,  // Add spacing between cards, adjust as needed
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,      // Rounded corners
    shadowColor: '#000',  // Shadow color
    shadowOffset: { width: 4, height: 2 }, // Shadow offset (right and down)
    shadowOpacity: 0.2,   // Shadow opacity
    shadowRadius: 4,     // Shadow blur radius
    elevation: 5,       // For Android shadow
  },
  textContainer: {
    flex: 1,              // Take up available space
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',  // Text color
  },
  subtitle: {
    fontSize: 16,
    color: 'white',  // Text color
  },
  image: {
    width: 80,         // Adjust size as needed
    height: 80,        // Adjust size as needed
    marginLeft: 16,     // Space between text and image
  },
});


export default FullWidthGradientCard;

