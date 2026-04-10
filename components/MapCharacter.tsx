import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';

const FRAMES = [
  require('../assets/character/walk-frame1.png'),
  require('../assets/character/walk-frame2.png'),
];

type Props = {
  latitude: number;
  longitude: number;
  hasBooks: boolean;
};

export function MapCharacter({ latitude, longitude, hasBooks }: Props) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentFrame((f) => (f === 0 ? 1 : 0));
    }, 350);
    return () => clearInterval(id);
  }, []);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 1 }}
      zIndex={10}
      tracksViewChanges={true}
    >
      <Image
        source={FRAMES[currentFrame]}
        style={{ width: 48, height: 48 }}
        resizeMode="contain"
      />

      <Callout tooltip={false}>
        <View style={styles.callout}>
          <Text style={styles.calloutText}>
            {hasBooks ? '📍 現在地' : '本をとうろくして旅に出よう！'}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  callout: {
    padding: 8,
    minWidth: 120,
  },
  calloutText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
});
