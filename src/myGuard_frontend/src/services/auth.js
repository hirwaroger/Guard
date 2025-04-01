import { PlugLogin, StoicLogin, NFIDLogin, IdentityLogin, Types, CreateActor } from 'ic-auth';

// Helper to get whitelisted canisters from environment
const getWhitelistedCanisters = () => {
  // Parse canister IDs from env variables
  const canisterIds = [];
  
  if (process.env.CANISTER_ID_MYGUARD_FRONTEND) {
    canisterIds.push(process.env.CANISTER_ID_MYGUARD_FRONTEND);
  }
  
  if (process.env.CANISTER_ID_MYGUARD_BACKEND) {
    canisterIds.push(process.env.CANISTER_ID_MYGUARD_BACKEND);
  }
  
  // Add any additional canisters from .env file
  if (process.env.ADDITIONAL_WHITELIST) {
    const additionalIds = process.env.ADDITIONAL_WHITELIST.split(',');
    canisterIds.push(...additionalIds);
  }
  
  return canisterIds;
};

// Authentication handler for various wallet providers
export const authenticateUser = async (provider) => {
  const whitelist = getWhitelistedCanisters();
  
  // Default user object
  let userObject = {
    principal: null,
    agent: null,
    provider: "Not Connected"
  };
  
  try {
    switch (provider) {
      case "Plug":
        userObject = await PlugLogin(whitelist);
        break;
      case "Stoic":
        userObject = await StoicLogin();
        break;
      case "NFID":
        userObject = await NFIDLogin();
        break;
      case "Identity":
        userObject = await IdentityLogin();
        break;
      default:
        throw new Error("Unsupported provider");
    }
    
    if (!userObject.principal || userObject.principal === "Not Connected.") {
      throw new Error("Authentication failed");
    }
    
    // Store authentication data
    localStorage.setItem('authProvider', provider);
    localStorage.setItem('userPrincipal', userObject.principal);
    
    return userObject;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};

// Log out user
export const logoutUser = () => {
  localStorage.removeItem('authProvider');
  localStorage.removeItem('userPrincipal');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const principal = localStorage.getItem('userPrincipal');
  return !!principal && principal !== "Not Connected.";
};

// Get current user info
export const getCurrentUser = () => {
  return {
    principal: localStorage.getItem('userPrincipal'),
    provider: localStorage.getItem('authProvider')
  };
};
