"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";

import { OrangeMediumActionButton, PurpleMediumActionButton } from "@/components/ui-lab/action-buttons";
import { BorderComboFrame1 } from "@/components/ui-lab/border-combo-frame-1";

import styles from "./formal-auth-collections.module.css";

type AuthCollectionProps = {
  scale?: number;
};

function EyeButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.eyeButton}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        className={[styles.eyeIcon, visible ? styles.eyeIconVisible : ""].join(" ")}
      />
    </button>
  );
}

function AuthField({
  className,
  label,
  value,
  placeholder,
  type,
  onChange,
  children,
}: {
  className: string;
  label: string;
  value: string;
  placeholder: string;
  type: string;
  onChange: (value: string) => void;
  children?: ReactNode;
}) {
  return (
    <label className={[styles.field, className, value ? styles.fieldFilled : ""].join(" ")}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        placeholder={value ? "" : placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {children}
    </label>
  );
}

function AuthScaleFrame({
  height,
  scale = 1,
  children,
}: {
  height: number;
  scale?: number;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.scaleFrame}
      style={
        {
          "--auth-height": `${height}px`,
          "--auth-scale": scale,
          height: `${height * scale}px`,
          width: `${380 * scale}px`,
        } as CSSProperties
      }
    >
      <div className={styles.scaleInner}>{children}</div>
    </div>
  );
}

export function LoginCollection({ scale = 1 }: AuthCollectionProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);

  return (
    <AuthScaleFrame height={588} scale={scale}>
      <section className={[styles.panel, styles.loginPanel].join(" ")} style={{ "--panel-height": "588px" } as CSSProperties}>
      <BorderComboFrame1 className={styles.frame} />
      <div className={[styles.registerLogoGroup, styles.loginLogoGroup].join(" ")} aria-hidden="true">
        <span className={styles.registerLogoMark} />
        <span className={styles.registerLogoText} />
      </div>
      <div className={styles.content}>
        <AuthField
          className={styles.loginEmail}
          label="Email"
          value={email}
          placeholder="Please enter your email"
          type="email"
          onChange={setEmail}
        />

        <AuthField
          className={styles.loginPassword}
          label="Password"
          value={password}
          placeholder="Please enter your password"
          type={passwordVisible ? "text" : "password"}
          onChange={setPassword}
        >
          <EyeButton visible={passwordVisible} onClick={() => setPasswordVisible((value) => !value)} />
        </AuthField>

        <label className={[styles.terms, styles.loginTerms].join(" ")}>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            I have read and agreed to the <span className={styles.linkText}>Terms of Use</span> and{" "}
            <span className={styles.linkText}>Privacy Policy</span>.
          </span>
        </label>

        <div className={styles.loginSignInSlot}>
          <div className={styles.buttonSlot}>
            <PurpleMediumActionButton label="Sign In" type="submit" />
          </div>
        </div>
        <div className={styles.loginSignUpSlot}>
          <div className={styles.buttonSlot}>
            <OrangeMediumActionButton label="Sign Up" type="button" />
          </div>
        </div>

        <button type="button" className={styles.forgot}>
          Forgot Password
        </button>
      </div>
    </section>
    </AuthScaleFrame>
  );
}

export function RegisterCollection({ scale = 1 }: AuthCollectionProps = {}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <AuthScaleFrame height={662} scale={scale}>
      <section className={[styles.panel, styles.registerPanel].join(" ")} style={{ "--panel-height": "662px" } as CSSProperties}>
      <BorderComboFrame1 className={styles.frame} />
      <div className={styles.registerLogoGroup} aria-hidden="true">
        <span className={styles.registerLogoMark} />
        <span className={styles.registerLogoText} />
      </div>
      <div className={styles.content}>
        <AuthField
          className={styles.registerEmail}
          label="Email"
          value={email}
          placeholder="Please enter your email"
          type="email"
          onChange={setEmail}
        />

        <AuthField
          className={[styles.codeField, styles.registerCode].join(" ")}
          label="Verification Code"
          value={code}
          placeholder="Enter Email Verification Code"
          type="text"
          onChange={setCode}
        >
          <button type="button" className={styles.sendCode} onClick={() => setSent(true)}>
            {sent ? "Sent" : "Send Code"}
          </button>
        </AuthField>

        <AuthField
          className={styles.registerPassword}
          label="Password"
          value={password}
          placeholder="Please enter your password"
          type={passwordVisible ? "text" : "password"}
          onChange={setPassword}
        >
          <EyeButton visible={passwordVisible} onClick={() => setPasswordVisible((value) => !value)} />
        </AuthField>

        <AuthField
          className={styles.registerConfirm}
          label="Confirm Password"
          value={confirmPassword}
          placeholder="Please enter your password again"
          type={confirmVisible ? "text" : "password"}
          onChange={setConfirmPassword}
        >
          <EyeButton visible={confirmVisible} onClick={() => setConfirmVisible((value) => !value)} />
        </AuthField>

        <label className={[styles.terms, styles.registerTerms].join(" ")}>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span className={styles.registerTermsText}>
            I have read and agreed to the and <span className={styles.linkText}>Terms of Use</span>{" "}
            <span className={styles.linkText}>Privacy Policy</span> .
          </span>
        </label>

        <button type="button" className={styles.registerSignIn}>
          Sign In
        </button>
        <div className={styles.registerSignUpSlot}>
          <div className={styles.buttonSlot}>
            <OrangeMediumActionButton label="Sign Up" type="submit" />
          </div>
        </div>
      </div>
    </section>
    </AuthScaleFrame>
  );
}

export function AuthPairCollection({ scale = 1 }: AuthCollectionProps = {}) {
  const [mode, setMode] = useState<"forgot" | "login" | "register">("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sent, setSent] = useState(false);
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const panelHeight = isRegister ? 662 : 588;

  return (
    <AuthScaleFrame height={panelHeight} scale={scale}>
      <section
        className={[styles.panel, isRegister ? styles.registerPanel : styles.loginPanel].join(" ")}
        style={{ "--panel-height": `${panelHeight}px` } as CSSProperties}
      >
        <BorderComboFrame1 className={styles.frame} />
        <div className={[styles.registerLogoGroup, isRegister ? "" : styles.loginLogoGroup].join(" ")} aria-hidden="true">
          <span className={styles.registerLogoMark} />
          <span className={styles.registerLogoText} />
        </div>
        <div className={styles.content}>
          {isRegister ? (
            <>
              <AuthField
                className={styles.registerEmail}
                label="Email"
                value={email}
                placeholder="Please enter your email"
                type="email"
                onChange={setEmail}
              />

              <AuthField
                className={[styles.codeField, styles.registerCode].join(" ")}
                label="Verification Code"
                value={code}
                placeholder="Enter Email Verification Code"
                type="text"
                onChange={setCode}
              >
                <button type="button" className={styles.sendCode} onClick={() => setSent(true)}>
                  {sent ? "Sent" : "Send Code"}
                </button>
              </AuthField>

              <AuthField
                className={styles.registerPassword}
                label="Password"
                value={password}
                placeholder="Please enter your password"
                type={passwordVisible ? "text" : "password"}
                onChange={setPassword}
              >
                <EyeButton visible={passwordVisible} onClick={() => setPasswordVisible((value) => !value)} />
              </AuthField>

              <AuthField
                className={styles.registerConfirm}
                label="Confirm Password"
                value={confirmPassword}
                placeholder="Please enter your password again"
                type={confirmVisible ? "text" : "password"}
                onChange={setConfirmPassword}
              >
                <EyeButton visible={confirmVisible} onClick={() => setConfirmVisible((value) => !value)} />
              </AuthField>

              <label className={[styles.terms, styles.registerTerms].join(" ")}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span className={styles.registerTermsText}>
                  I have read and agreed to the and <span className={styles.linkText}>Terms of Use</span>{" "}
                  <span className={styles.linkText}>Privacy Policy</span> .
                </span>
              </label>

              <button type="button" className={styles.registerSignIn} onClick={() => setMode("login")}>
                Sign In
              </button>
              <div className={styles.registerSignUpSlot}>
                <div className={styles.buttonSlot}>
                  <OrangeMediumActionButton
                    className={[styles.authFlowButton, styles.authFlowButtonGold].join(" ")}
                    label="Sign Up"
                    type="submit"
                  />
                </div>
              </div>
            </>
          ) : isForgot ? (
            <>
              <p className={styles.forgotIntro}>
                Enter your email and we will send a password reset link.
              </p>

              <AuthField
                className={styles.forgotEmail}
                label="Email"
                value={email}
                placeholder="Please enter your email"
                type="email"
                onChange={setEmail}
              />

              {sent ? (
                <p className={styles.forgotSuccess}>
                  Reset link sent. Please check your inbox.
                </p>
              ) : null}

              <div className={styles.forgotSubmitSlot}>
                <div className={styles.buttonSlot}>
                  <PurpleMediumActionButton
                    className={[styles.authFlowButton, styles.authFlowButtonSlate].join(" ")}
                    label="Submit"
                    type="button"
                    onClick={() => setSent(true)}
                  />
                </div>
              </div>

              <button type="button" className={styles.forgotSignIn} onClick={() => setMode("login")}>
                Sign In
              </button>
              <button type="button" className={styles.forgotSignUp} onClick={() => setMode("register")}>
                Sign Up
              </button>
            </>
          ) : (
            <>
              <AuthField
                className={styles.loginEmail}
                label="Email"
                value={email}
                placeholder="Please enter your email"
                type="email"
                onChange={setEmail}
              />

              <AuthField
                className={styles.loginPassword}
                label="Password"
                value={password}
                placeholder="Please enter your password"
                type={passwordVisible ? "text" : "password"}
                onChange={setPassword}
              >
                <EyeButton visible={passwordVisible} onClick={() => setPasswordVisible((value) => !value)} />
              </AuthField>

              <label className={[styles.terms, styles.loginTerms].join(" ")}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  I have read and agreed to the <span className={styles.linkText}>Terms of Use</span> and{" "}
                  <span className={styles.linkText}>Privacy Policy</span>.
                </span>
              </label>

              <div className={styles.loginSignInSlot}>
                <div className={styles.buttonSlot}>
                  <PurpleMediumActionButton
                    className={[styles.authFlowButton, styles.authFlowButtonSlate].join(" ")}
                    label="Sign In"
                    type="submit"
                  />
                </div>
              </div>
              <div className={styles.loginSignUpSlot}>
                <div className={styles.buttonSlot}>
                  <OrangeMediumActionButton
                    className={[styles.authFlowButton, styles.authFlowButtonGold].join(" ")}
                    label="Sign Up"
                    type="button"
                    onClick={() => setMode("register")}
                  />
                </div>
              </div>

              <button type="button" className={styles.forgot} onClick={() => setMode("forgot")}>
                Forgot Password
              </button>
            </>
          )}
        </div>
      </section>
    </AuthScaleFrame>
  );
}
