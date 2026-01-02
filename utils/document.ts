import { DocumentType, DocumentTypeName } from "@/types/models";

/**
 * Converts a string (name or id) to a DocumentType enum value.
 * Returns undefined if not found.
 */
export function documentTypeFromString(str: string): DocumentType | undefined {
  if (!str) return undefined;
  const normalized = str.trim().toLowerCase();

  switch (normalized) {
    case "caderneta":
    case "caderneta predial":
    case "1":
      return DocumentType.CadernetaPredial;
    case "certidao":
    case "certidao permanente":
    case "certidao permanente registo predial":
    case "2":
      return DocumentType.CertidaoPermanenteRegistoPredial;
    case "titulo":
    case "escritura":
    case "titulo de aquisição":
    case "titulo de aquisição / escritura":
    case "3":
      return DocumentType.TituloAquisicaoOuEscritura;
    case "licenca":
    case "licença":
    case "licenca utilizacao":
    case "licença de utilização":
    case "licenca utilizacao ou isencao":
    case "licença de utilização / isenção":
    case "4":
      return DocumentType.LicencaUtilizacaoOuIsencao;
    case "certificado energetico":
    case "certificado energético":
    case "5":
      return DocumentType.CertificadoEnergetico;
    case "ficha tecnica":
    case "ficha técnica de habitação":
    case "6":
      return DocumentType.FichaTecnicaHabitacao;
    case "plantas":
    case "plantas do imóvel":
    case "plantas imovel ou camararias":
    case "7":
      return DocumentType.PlantasImovelOuCamararias;
    case "projeto construcao":
    case "projeto construção e licenças de obra":
    case "8":
      return DocumentType.ProjetoConstrucaoELicencasObra;
    case "comprovativo imi":
    case "comprovativo pagamento imi":
    case "9":
      return DocumentType.ComprovativoPagamentoIMI;
    case "contrato arrendamento":
    case "20":
      return DocumentType.ContratoArrendamento;
    case "planta localizacao":
    case "planta localização":
    case "40":
      return DocumentType.PlantaLocalizacao;
    case "levantamento topografico":
    case "levantamento topográfico":
    case "41":
      return DocumentType.LevantamentoTopografico;
    case "informacao previa":
    case "informação prévia / pip":
    case "42":
      return DocumentType.InformacaoPreviaOuPIP;
    case "alvara loteamento":
    case "alvará de loteamento":
    case "43":
      return DocumentType.AlvaraLoteamento;
    case "pareceres camararios":
    case "pareceres camarários":
    case "44":
      return DocumentType.PareceresCamararios;
    case "regulamento condominio":
    case "regulamento de condomínio":
    case "60":
      return DocumentType.RegulamentoCondominio;
    case "atas condominio":
    case "atas de condomínio":
    case "61":
      return DocumentType.AtasCondominio;
    case "seguro edificio partes comuns":
    case "seguro edifício (partes comuns)":
    case "62":
      return DocumentType.SeguroEdificioPartesComuns;
    case "relatorio contas condominio":
    case "relatório de contas de condomínio":
    case "63":
      return DocumentType.RelatorioContasCondominio;
    case "mapa quotas recibos condominio":
    case "mapa de quotas e recibos de condomínio":
    case "64":
      return DocumentType.MapaQuotasERecibosCondominio;
    case "contratos manutencao":
    case "contratos de manutenção":
    case "65":
      return DocumentType.ContratosManutencao;
    case "inspecoes obrigatorias":
    case "inspeções obrigatórias":
    case "66":
      return DocumentType.InspecoesObrigatorias;
    case "orcamentos obras partes comuns":
    case "orçamentos e obras (partes comuns)":
    case "67":
      return DocumentType.OrcamentosEObrasPartesComuns;
    case "contrato administracao condominio":
    case "contrato de administração de condomínio":
    case "68":
      return DocumentType.ContratoAdministracaoCondominio;
    case "outro":
    case "other":
    case "999":
      return DocumentType.Other;
    default:
      return undefined;
  }
}

/**
 * Converts a DocumentType enum value to its numeric ID.
 */
export function documentTypeToId(type: DocumentType): number {
  return type as number;
}

/**
 * Converts a DocumentType enum value to its canonical string name.
 * Returns "Documento" if not found.
 */
export function documentTypeToString(type: DocumentType): string {
  return DocumentTypeName[type] || "Documento";
}
