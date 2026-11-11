import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { DentistesClient, type MeResponse, type Patient } from "@dentistes/sdk";

const state = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
};

export default function App() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:8080");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function client(): DentistesClient {
    return new DentistesClient({
      baseUrl,
      mode: "native",
      getAccessToken: () => state.accessToken,
      onAccessToken: (token) => {
        state.accessToken = token;
      },
      getRefreshToken: () => state.refreshToken,
      onRefreshToken: (token) => {
        state.refreshToken = token;
      },
    });
  }

  async function login() {
    setLoading(true);
    setError(null);
    try {
      const sdk = client();
      await sdk.login(email, password);
      const profile = await sdk.me();
      setMe(profile);
      if (profile.features.patients) {
        const res = await sdk.listPatients({ limit: 20 });
        setPatients(res.patients);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await client().logout().catch(() => undefined);
    state.accessToken = null;
    state.refreshToken = null;
    setMe(null);
    setPatients([]);
  }

  if (me) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Dentistes</Text>
            <Text style={styles.subtitle}>{me.active_tenant?.name ?? "Platform admin"}</Text>
          </View>
          <Pressable onPress={logout} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Salir</Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          {me.entitlements.blocked_reason ? (
            <Text style={styles.alert}>
              Funciones de pago bloqueadas: {me.entitlements.blocked_reason}
            </Text>
          ) : null}
          <Text style={styles.sectionTitle}>Funcionalidades</Text>
          <View style={styles.features}>
            {me.feature_catalog.map((feature) => (
              <View key={feature.key} style={[styles.feature, !me.features[feature.key] && styles.featureOff]}>
                <Text style={styles.featureName}>{feature.name}</Text>
                <Text style={styles.featureState}>{me.features[feature.key] ? "Activa" : "Bloqueada"}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Pacientes recientes</Text>
          <FlatList
            data={patients}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.muted}>Sin pacientes o funcionalidad no incluida.</Text>}
            renderItem={({ item }) => (
              <View style={styles.patient}>
                <Text style={styles.patientName}>
                  {item.last_name}, {item.first_name}
                </Text>
                <Text style={styles.muted}>{item.phone}</Text>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.login}>
        <Text style={styles.brand}>Dentistes</Text>
        <Text style={styles.subtitle}>Acceso a tu clínica</Text>
        {error ? <Text style={styles.alert}>{error}</Text> : null}
        <TextInput style={styles.input} placeholder="API (http://IP:8080)" value={baseUrl} onChangeText={setBaseUrl} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
        <Pressable onPress={login} style={styles.button} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  login: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 18, fontWeight: "700", color: "#0f766e" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  content: { padding: 20, flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a", marginTop: 16, marginBottom: 8 },
  features: { gap: 8 },
  feature: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  featureOff: { opacity: 0.55 },
  featureName: { fontSize: 14, color: "#0f172a" },
  featureState: { fontSize: 12, color: "#0f766e" },
  patient: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  patientName: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  muted: { fontSize: 12, color: "#64748b", marginTop: 2 },
  alert: { backgroundColor: "#fef2f2", color: "#991b1b", padding: 10, borderRadius: 8, fontSize: 13 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  button: { backgroundColor: "#0d9488", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  secondaryButtonText: { fontSize: 13, color: "#334155" },
});
