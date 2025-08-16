// components/Avatar.jsx
import { Image, Text, View } from 'react-native';

function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

export default function Avatar({
  name,
  uri,           // cloudinary URL or any remote image
  size = 50,
  bg = '#6B21A8',
  textColor = '#fff',
  style,
}) {
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: radius, backgroundColor: '#eee' }, style]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text style={{ color: textColor, fontWeight: '700' }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
