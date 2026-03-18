/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail — Gerenciar Frotas</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://xtxzhaddomtwlktuhkxf.supabase.co/storage/v1/object/public/email-assets/logo-gerenciar-frotas.png" width="180" height="auto" alt="Gerenciar Frotas" style={logo} />
        <Heading style={h1}>Confirme seu e-mail</Heading>
        <Text style={text}>
          Obrigado por se cadastrar no{' '}
          <Link href={siteUrl} style={link}><strong>Gerenciar Frotas</strong></Link>!
        </Text>
        <Text style={text}>
          Para ativar sua conta, confirme seu endereço de e-mail ({' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>
          ) clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>Confirmar E-mail</Button>
        <Text style={footer}>Se você não criou uma conta, ignore este e-mail.</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const logo = { marginBottom: '24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7c8594', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#eda611', textDecoration: 'underline' }
const button = { backgroundColor: '#eda611', color: '#0f172a', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0' }
