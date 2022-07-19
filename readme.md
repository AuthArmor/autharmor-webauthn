# AuthArmor WebAuthn SDK

## 🏁 Installation

You can integrate the AuthArmor SDK into your website by installing and importing our NPM package:

```bash
# Via NPM
npm i -s autharmor-webauthn-sdk

# Via Yarn
yarn add autharmor-webauthn-sdk
```

You can also load the SDK via our CDN by placing this `script` tag in your app's `<head>`

```html
<script src="https://cdn.autharmor.com/scripts/autharmor-webauthn-sdk/v2.0.0/autharmor-webauthn-sdk_v2.0.0.js"></script>
```

## Typescript

This SDK is fully coded in TypeScript and its definition files are bundled by default when installing it through NPM/Yarn

## 🧭 Usage

### 🚀 Initializing the SDK

In order to initialize the SDK, you'll have to create a new instance of the AuthArmor SDK with the url of your backend API specified in it.

```javascript
const SDK = new AuthArmorWebAuthnSDK({
  webauthnClientId: "..." // Obtain your Webauthn client ID through the AuthArmor dashboard
});
```

## Creating new WebAuthn credentials

Registering your WebAuthn key using the SDK is pretty simple, all you have to do is pass the autharmor challenge that you'd receive from the AuthArmor API while attempting to register a new credential and the SDK will authenticate the user and produce a JSON payload that can be sent through HTTP safely. The produced payload should be directly compatible with both the AuthArmor API and the Backend SDK as well

```js
const payload = await SDK.create(fido2Challenge);
// Send payload to your backend for verification using the AuthArmor backend SDK!
```

## Signing using existing credentials

Using your WebAuthn key using the SDK is pretty simple, all you have to do is pass the autharmor challenge that you'd receive from the AuthArmor API while attempting to login for example and the SDK will authenticate the user and produce a JSON payload that can be sent through HTTP safely for the backend/AuthArmor API to verify. The produced payload should be directly compatible with both the AuthArmor API and the Backend SDK as well

```js
const payload = await SDK.get(challenge.fido2_json_response);
// Send payload to your backend for verification using the AuthArmor backend SDK!
```
