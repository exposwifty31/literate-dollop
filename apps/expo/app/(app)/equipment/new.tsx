import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { createEquipment } from "@/lib/api/equipment-actions";
import { t } from "@/lib/i18n";

interface FormState {
  name: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  location: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) {
    errors.name = t.newEquipment.fields.name.error;
  }
  return errors;
}

export default function NewEquipmentScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<FormState>({
    name: "",
    serialNumber: "",
    model: "",
    manufacturer: "",
    location: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (saving) return;
    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createEquipment({
        name: form.name.trim(),
        serialNumber: form.serialNumber.trim() || undefined,
        model: form.model.trim() || undefined,
        manufacturer: form.manufacturer.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      router.back();
    } catch {
      setSaveError(t.newEquipment.toast.addError(""));
    } finally {
      setSaving(false);
    }
  };

  const inputBase = {
    color: colors.text,
    borderColor: colors.text + "33",
    backgroundColor: colors.background,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t.newEquipment.fields.name.label}
          </Text>
          <TextInput
            style={[styles.input, inputBase, errors.name ? styles.inputError : null]}
            placeholder={t.newEquipment.fields.name.placeholder}
            placeholderTextColor="#9ca3af"
            value={form.name}
            onChangeText={setField("name")}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel={t.newEquipment.fields.name.label}
          />
          {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t.equipmentDetail.serialNumber}
          </Text>
          <TextInput
            style={[styles.input, inputBase]}
            placeholder={t.newEquipment.fields.serialNumber.placeholder}
            placeholderTextColor="#9ca3af"
            value={form.serialNumber}
            onChangeText={setField("serialNumber")}
            autoCapitalize="characters"
            returnKeyType="next"
            accessibilityLabel={t.equipmentDetail.serialNumber}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t.equipmentDetail.model}</Text>
          <TextInput
            style={[styles.input, inputBase]}
            placeholder={t.newEquipment.fields.model.placeholder}
            placeholderTextColor="#9ca3af"
            value={form.model}
            onChangeText={setField("model")}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel={t.equipmentDetail.model}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t.equipmentDetail.manufacturer}
          </Text>
          <TextInput
            style={[styles.input, inputBase]}
            placeholder={t.newEquipment.fields.manufacturer.placeholder}
            placeholderTextColor="#9ca3af"
            value={form.manufacturer}
            onChangeText={setField("manufacturer")}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel={t.equipmentDetail.manufacturer}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t.equipmentDetail.location}</Text>
          <TextInput
            style={[styles.input, inputBase]}
            placeholder={t.newEquipment.fields.location.placeholder}
            placeholderTextColor="#9ca3af"
            value={form.location}
            onChangeText={setField("location")}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={() => {
              void handleSave();
            }}
            accessibilityLabel={t.equipmentDetail.location}
          />
        </View>

        {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

        <Pressable
          onPress={() => {
            void handleSave();
          }}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.tint, opacity: saving || pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{t.newEquipment.saveEquipment}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#dc2626",
  },
  fieldError: {
    color: "#dc2626",
    fontSize: 13,
  },
  saveError: {
    color: "#dc2626",
    fontSize: 14,
    textAlign: "center",
  },
  saveBtn: {
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
