import { StyleSheet, Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BASE_WIDTH = 375;
const MIN_SCALE = 0.78;
const MAX_SCALE = 1.08; 
const widthScale = Math.min(Math.max(SCREEN_WIDTH / BASE_WIDTH, MIN_SCALE), MAX_SCALE);

const systemFontScale = PixelRatio.getFontScale();
const fontScaleCorrection = systemFontScale > 1.2 ? 1.2 / systemFontScale : 1;

export function scaleFont(size) {
  return Math.round(size * widthScale * fontScaleCorrection);
}

export const COLORS = {
  primary: '#B266FF',
  primaryDark: '#8B3EE6',
  primaryLight: '#D1A3FF',
  secondary: '#00A3FF',
  secondaryDark: '#0077CC',
  success: '#00FF88',
  successDark: '#00CC66',
  warning: '#FFB800',
  danger: '#FF3B5C',
  info: '#FF8833',
  background: '#02010A',
  surface: '#090014',
  surfaceLight: '#12002E',
  surfaceDark: '#0D001A',
  text: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  border: '#7B2CFF',
  borderLight: '#3D2BFF',
  borderDark: '#2A1A4A',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  round: 999,
};

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  contentContainer: {
    paddingBottom: SPACING.xxxl,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  cardLarge: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxxl,
    padding: SPACING.xxl,
    marginBottom: SPACING.lg,
  },

  // Textos
  title: {
    color: COLORS.primary,
    fontSize: scaleFont(42),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
  titleSmall: {
    color: COLORS.primary,
    fontSize: scaleFont(38),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: scaleFont(14),
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  label: {
    color: COLORS.secondary,
    fontSize: scaleFont(18),
    marginTop: SPACING.lg,
  },
  value: {
    color: COLORS.text,
    fontSize: scaleFont(28),
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  status: {
    fontSize: scaleFont(26),
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },
  score: {
    fontSize: scaleFont(26),
    fontWeight: 'bold',
    marginTop: SPACING.xs,
  },

  // Progresso
  progressBar: {
    height: 24,
    backgroundColor: '#140021',
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    color: COLORS.text,
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: SPACING.md,
  },

  // Seções
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: scaleFont(18),
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: scaleFont(14),
    marginBottom: SPACING.md,
  },

  button: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    minHeight: scaleFont(20) * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#2D1B4E',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    minHeight: scaleFont(20) * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#1A2A4A',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    minHeight: scaleFont(20) * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSuccess: {
    backgroundColor: '#0A2A1A',
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    minHeight: scaleFont(20) * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDanger: {
    backgroundColor: '#2A0010',
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: BORDER_RADIUS.xxl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    minHeight: scaleFont(20) * 2.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.text,
    textAlign: 'center',
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    width: '100%',
    flexWrap: 'wrap',
    includeFontPadding: false,
  },
  buttonTextSmall: {
    color: COLORS.text,
    textAlign: 'center',
    fontSize: scaleFont(16),
    fontWeight: 'bold',
    width: '100%',
    flexWrap: 'wrap',
    includeFontPadding: false,
  },

  // Inputs
  input: {
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    color: COLORS.text,
    fontSize: scaleFont(18),
    marginBottom: SPACING.xl,
    backgroundColor: '#091028',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    borderRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.xl,
    backgroundColor: '#091028',
    marginBottom: SPACING.xl,
  },
  passwordInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: scaleFont(18),
    paddingVertical: SPACING.xl,
  },

  // Detalhes de pontuação
  detailRow: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  detailPositive: {
    backgroundColor: '#0A2A1A',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  detailNegative: {
    backgroundColor: '#2A0A0A',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  detailNeutral: {
    backgroundColor: '#1A1A2A',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailCriterion: {
    color: COLORS.text,
    fontSize: scaleFont(16),
    fontWeight: 'bold',
    flex: 1,
  },
  detailPoints: {
    fontSize: scaleFont(16),
    fontWeight: 'bold',
  },
  detailFound: {
    color: COLORS.secondary,
    fontSize: scaleFont(13),
  },

  // Filtros
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterLabel: {
    color: COLORS.secondary,
    fontSize: scaleFont(14),
    marginBottom: SPACING.sm,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.md,
  },
  filterChipActive: {
    backgroundColor: COLORS.border,
  },
  filterChipText: {
    color: COLORS.primary,
    fontSize: scaleFont(13),
  },
  filterChipTextActive: {
    color: COLORS.text,
  },

  // Cards de relatório
  reportCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  reportCardBody: {
    flex: 1,
    padding: SPACING.xl,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCardTitle: {
    color: COLORS.text,
    fontSize: scaleFont(22),
    fontWeight: 'bold',
    flex: 1,
    marginRight: SPACING.sm,
  },
  reportCardScore: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
  },
  reportCardDate: {
    color: COLORS.secondary,
    fontSize: scaleFont(13),
    marginTop: SPACING.sm,
  },
  reportCardStatus: {
    fontSize: scaleFont(16),
    marginTop: SPACING.sm,
    fontWeight: 'bold',
  },
  reportCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0015',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border + '44',
  },
  actionButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border + '44',
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: scaleFont(12),
    fontWeight: 'bold',
  },
  deleteButton: {
    borderLeftColor: COLORS.danger + '44',
  },
  deleteText: {
    color: COLORS.danger,
  },

  // Visualização de relatório
  reportBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xxxl,
  },
  reportText: {
    color: COLORS.text,
    fontSize: scaleFont(13),
    lineHeight: 20,
    fontFamily: 'monospace',
  },

  // Botões de ação em linha
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },

  // Resultados
  resultCount: {
    color: COLORS.textSecondary,
    fontSize: scaleFont(12),
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: scaleFont(16),
    textAlign: 'center',
    marginTop: 60,
    lineHeight: 26,
  },

  // Layout flexível
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  
   crackTime: {
    fontSize: scaleFont(30),
    fontWeight: 'bold',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  crackNote: {
    color: COLORS.textMuted,
    fontSize: scaleFont(12),
    marginTop: SPACING.xs,
  },

  // Espaçamentos
  mtSm: { marginTop: SPACING.sm },
  mtMd: { marginTop: SPACING.md },
  mtLg: { marginTop: SPACING.lg },
  mtXl: { marginTop: SPACING.xl },
  mbSm: { marginBottom: SPACING.sm },
  mbMd: { marginBottom: SPACING.md },
  mbLg: { marginBottom: SPACING.lg },
  mbXl: { marginBottom: SPACING.xl },
});

export const getScoreColor = (score) => {
  if (score >= 70) return COLORS.success;
  if (score >= 30) return COLORS.warning;
  if (score >= -30) return COLORS.info;
  return COLORS.danger;
};

export const getScoreStatus = (score) => {
  if (score >= 70) return 'SEGURA';
  if (score >= 30) return 'MODERADA';
  if (score >= -30) return 'FRACA';
  return 'CRÍTICA';
};

export const getPointsColor = (points) => {
  if (points > 0) return COLORS.success;
  return COLORS.danger;
};