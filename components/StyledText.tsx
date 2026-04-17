import { StyleSheet } from 'react-native'

import { Text, TextProps } from './Themed'

const styles = StyleSheet.create({
  mono: { fontFamily: 'SpaceMono' },
})

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.mono]} />
}
