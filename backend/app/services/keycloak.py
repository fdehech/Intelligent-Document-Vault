import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logger import logger


class KeycloakService:
    """Service for interacting with Keycloak SSO."""
    
    def __init__(self):
        self.base_url = settings.KEYCLOAK_URL
        self.realm = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET
        self.token_url = f"{self.base_url}/realms/{self.realm}/protocol/openid-connect/token"
        self.userinfo_url = f"{self.base_url}/realms/{self.realm}/protocol/openid-connect/userinfo"
        self.logout_url = f"{self.base_url}/realms/{self.realm}/protocol/openid-connect/logout"
    
    async def verify_token(self, access_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify an access token and return user information.
        
        Args:
            access_token: The access token to verify
            
        Returns:
            User information if token is valid, None otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.userinfo_url,
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"Token verification failed: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error verifying token: {e}")
            return None
    
    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Optional[Dict[str, Any]]:
        """
        Exchange an authorization code for an access token.
        
        Args:
            code: Authorization code from Keycloak
            redirect_uri: Redirect URI used in the authorization request
            
        Returns:
            Token response if successful, None otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data={
                        "grant_type": "authorization_code",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "code": code,
                        "redirect_uri": redirect_uri
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            logger.error(f"Error exchanging code for token: {e}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh an access token using a refresh token.
        
        Args:
            refresh_token: The refresh token
            
        Returns:
            New token response if successful, None otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.token_url,
                    data={
                        "grant_type": "refresh_token",
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": refresh_token
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Token refresh failed: {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
    
    async def logout(self, refresh_token: str) -> bool:
        """
        Logout a user by invalidating their refresh token.
        
        Args:
            refresh_token: The refresh token to invalidate
            
        Returns:
            True if successful, False otherwise
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.logout_url,
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "refresh_token": refresh_token
                    }
                )
                
                return response.status_code == 204
        except Exception as e:
            logger.error(f"Error during logout: {e}")
            return False
    
    async def get_user_roles(self, access_token: str) -> list[str]:
        """
        Extract user roles from an access token.
        
        Args:
            access_token: The access token
            
        Returns:
            List of role names
        """
        user_info = await self.verify_token(access_token)
        if user_info:
            # Keycloak stores roles in different places depending on configuration
            roles = []
            
            # Check realm roles
            if "realm_access" in user_info and "roles" in user_info["realm_access"]:
                roles.extend(user_info["realm_access"]["roles"])
            
            # Check client roles
            if "resource_access" in user_info:
                for client, access in user_info["resource_access"].items():
                    if "roles" in access:
                        roles.extend(access["roles"])
            
            return roles
        return []


# Singleton instance
keycloak_service = KeycloakService()
