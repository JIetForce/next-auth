import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  render,
} from "@react-email/components";

export interface ResetPasswordTemplateProps {
  url: string;
}

export function ResetPasswordTemplate({ url }: ResetPasswordTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Siftloom password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandSection}>
            <Text style={brandText}>Siftloom</Text>
          </Section>
          <Heading style={heading}>Reset your password</Heading>
          <Text style={paragraph}>
            Click the button below to reset your password. This link is valid
            for a limited time.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={url}>
              Reset Password
            </Button>
          </Section>
          <Text style={subtext}>
            If the button doesn&apos;t work, copy and paste this link into your
            browser:
          </Text>
          <Text style={linkParagraph}>
            <Link href={url} style={link}>
              {url}
            </Link>
          </Text>
          <Hr style={hr} />
          <Text style={footerNote}>
            If you did not request this, you can ignore this message. Your
            password will not change until you access the link above and create
            a new one.
          </Text>
          <Text style={footerBrand}>
            Siftloom &bull; Curated AI and SaaS Discoveries
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderResetPassword(
  props: ResetPasswordTemplateProps,
): Promise<string> {
  return render(<ResetPasswordTemplate {...props} />);
}

export default ResetPasswordTemplate;

const main: React.CSSProperties = {
  backgroundColor: "#f8fafc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  margin: "0 auto",
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  margin: "0 auto",
  padding: "36px 40px",
  maxWidth: "560px",
};

const brandSection: React.CSSProperties = {
  paddingBottom: "16px",
  borderBottom: "1px solid #f1f5f9",
};

const brandText: React.CSSProperties = {
  color: "#2fb8ae",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0",
};

const heading: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "28px",
  margin: "24px 0 16px 0",
};

const paragraph: React.CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 20px 0",
};

const buttonContainer: React.CSSProperties = {
  margin: "28px 0",
  textAlign: "center",
};

const button: React.CSSProperties = {
  backgroundColor: "#2fb8ae",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "100%",
  padding: "14px 28px",
  textAlign: "center",
  textDecoration: "none",
};

const subtext: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "24px 0 6px 0",
};

const linkParagraph: React.CSSProperties = {
  margin: "0 0 24px 0",
  wordBreak: "break-all",
};

const link: React.CSSProperties = {
  color: "#2fb8ae",
  fontSize: "13px",
  lineHeight: "20px",
  textDecoration: "underline",
};

const hr: React.CSSProperties = {
  borderColor: "#e2e8f0",
  borderStyle: "solid",
  borderWidth: "1px 0 0 0",
  margin: "24px 0 16px 0",
};

const footerNote: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 8px 0",
};

const footerBrand: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};
