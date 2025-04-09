import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Divider, Menu, Text } from "react-native-paper";
Button;
type Props<T> = {
  options: {
    label: string;
    value: T;
  }[];
  onSelect: (val: T) => void;
  visible: boolean;
  placeholder: string;
};

export default function DropdownMenu<T>({
  options,
  onSelect,
  visible,
  placeholder,
}: Props<T>) {
  const [vis, setVisible] = useState(false);
  const closeMenu = () => setVisible(false);
  const openMenu = () => setVisible(true);
  useEffect(() => {
    setVisible(visible);
  }, [visible]);
  return (
    <View style={styles.container}>
      <Menu
        visible={vis}
        onDismiss={closeMenu}
        anchor={<Text onPress={openMenu}>{placeholder}</Text>}
      >
        {options.map((option, i) => (
          <View key={`item-${i}`}>
            <Menu.Item
              onPress={() => {
                onSelect(option.value);
                closeMenu();
              }}
              title={option.label}
            />
            <Divider />
          </View>
        ))}
      </Menu>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
  },
});
