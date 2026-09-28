import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useLanguage, type LanguageCode } from '@/hooks/useLanguage';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const ERROR_STRINGS: Record<string, { title: string; message: string; retry: string }> = {
  en: { title: 'Oops! Something went wrong', message: 'The app encountered an unexpected error. Don\'t worry, your data is safe!', retry: 'Try Again' },
  es: { title: '¡Vaya! Algo salió mal', message: 'La app encontró un error inesperado. ¡No te preocupes, tus datos están seguros!', retry: 'Intentar de nuevo' },
  fr: { title: 'Oups ! Quelque chose s\'est mal passé', message: 'L\'app a rencontré une erreur inattendue. Ne vous inquiétez pas, vos données sont en sécurité !', retry: 'Réessayer' },
  de: { title: 'Hoppla! Etwas ist schiefgelaufen', message: 'Die App hat einen unerwarteten Fehler festgestellt. Keine Sorge, deine Daten sind sicher!', retry: 'Erneut versuchen' },
  it: { title: 'Ops! Qualcosa è andato storto', message: 'L\'app ha riscontrato un errore imprevisto. Non preoccuparti, i tuoi dati sono al sicuro!', retry: 'Riprova' },
  pt: { title: 'Opa! Algo deu errado', message: 'O app encontrou um erro inesperado. Não se preocupe, seus dados estão seguros!', retry: 'Tentar novamente' },
  nl: { title: 'Oeps! Er ging iets mis', message: 'De app heeft een onverwachte fout ondervonden. Geen zorgen, je gegevens zijn veilig!', retry: 'Opnieuw proberen' },
  tr: { title: 'Olamaz! Bir şeyler ters gitti', message: 'Uygulama beklenmeyen bir hatayla karşılaştı. Endişelenmeyin, verileriniz güvende!', retry: 'Tekrar dene' },
};

function getErrorStrings(lang: string): { title: string; message: string; retry: string } {
  const code = lang.split('-')[0].toLowerCase();
  return ERROR_STRINGS[code] ?? ERROR_STRINGS.en;
}

export class ErrorBoundary extends Component<Props, State> {
  currentLang: LanguageCode = 'en';

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const strings = getErrorStrings(this.currentLang);

      return (
        <View style={styles.container}>
          <AlertTriangle size={48} color="#FF6B6B" />
          <Text style={styles.title}>{strings.title}</Text>
          <Text style={styles.message}>
            {strings.message}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <RefreshCw size={20} color="white" />
            <Text style={styles.retryText}>{strings.retry}</Text>
          </TouchableOpacity>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetails}>
              {this.state.error.toString()}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8F8',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Fredoka-Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
  },
  errorDetails: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFE6E6',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#CC0000',
  },
});
