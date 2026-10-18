import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { globalStyles, COLORS, SPACING } from '../styles/GlobalStyles';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={globalStyles.container}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: SPACING.xxl,
            }}
          >
            <Text style={[globalStyles.title, { fontSize: 32 }]}>ALGO DEU ERRADO</Text>

            <View style={[globalStyles.card, { borderColor: COLORS.danger }]}>
              <Text style={[globalStyles.sectionTitle, { color: COLORS.danger, textAlign: 'center' }]}>
                O aplicativo encontrou um erro inesperado
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SPACING.md }}>
                Seus dados e relatórios salvos não foram afetados. Tente reiniciar o app.
              </Text>

              {__DEV__ && this.state.error ? (
                <Text
                  style={{
                    color: COLORS.textMuted,
                    fontSize: 11,
                    marginTop: SPACING.lg,
                    fontFamily: 'monospace',
                  }}
                  selectable
                >
                  {String(this.state.error?.message || this.state.error)}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity style={globalStyles.buttonPrimary} onPress={this.handleReset}>
              <Text style={globalStyles.buttonText}>TENTAR NOVAMENTE</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}