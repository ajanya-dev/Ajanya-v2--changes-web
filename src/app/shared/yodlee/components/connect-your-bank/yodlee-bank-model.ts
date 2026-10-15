export interface IYodleeBanks {
  success?: boolean
  data: IYodleeBanksData
  status?: number
}

export interface IYodleeBanksData {
  provider: Provider[]
}

export interface Provider {
  PRIORITY: string
  id: number
  name: string
  loginUrl: string
  baseUrl: string
  favicon: string
  logo: string
  status: string
  isConsentRequired: boolean
  authType: string
  languageISOCode: string
  primaryLanguageISOCode: string
  countryISOCode: string
  lastModified: string
  isAutoRefreshEnabled: boolean
  capability?: Capability[]
  authParameter?: string[]
  associatedProviderIds?: number[]
  dataset: Dataset[]
  isAddedByUser: string
  forgetPasswordUrl?: string
  help?: string
  loginHelp?: string
  betaContainers?: string[]
}

export interface Capability {
  name: string
  container: string[]
}

export interface Dataset {
  name: string
  attribute: Attribute[]
}

export interface Attribute {
  name: string
  container: string[]
  containerAttributes?: ContainerAttributes
}

export interface ContainerAttributes {
  LOAN?: Loan
  BANK?: Bank
  CREDITCARD?: Creditcard
  INVESTMENT?: Investment
}

export interface Loan {
  numberOfTransactionDays: number
}

export interface Bank {
  numberOfTransactionDays: number
}

export interface Creditcard {
  numberOfTransactionDays: number
}

export interface Investment {
  numberOfTransactionDays: number
}
