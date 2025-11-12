#!/bin/bash
# Test OAuth Token Exchange
# Note: This requires PKCE (code_verifier) if your app uses it

# Replace these with your actual values
CODE="YOUR_AUTHORIZATION_CODE"
CLIENT_ID="YOUR_CLIENT_ID"
CLIENT_SECRET="YOUR_CLIENT_SECRET"
REDIRECT_URI="https://lotest.onrender.com/oauth/callback"
CODE_VERIFIER="YOUR_CODE_VERIFIER"  # Required if using PKCE

echo "Testing OAuth token exchange..."
echo ""

# With PKCE (current implementation)
curl -X POST https://login.salesforce.com/services/oauth2/token \
  -d "grant_type=authorization_code" \
  -d "code=${CODE}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "code_verifier=${CODE_VERIFIER}" \
  -H "Content-Type: application/x-www-form-urlencoded"

echo ""
echo ""
echo "Note: If you get an error about code_verifier, your app uses PKCE."
echo "You need to use the code_verifier that was generated during the /login step."

