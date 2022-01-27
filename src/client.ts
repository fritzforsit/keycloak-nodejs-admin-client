import {getToken, Credentials} from './utils/auth.js';
import {defaultBaseUrl, defaultRealm} from './utils/constants.js';
import {Cache} from './resources/cache.js';
import {Users} from './resources/users.js';
import {Groups} from './resources/groups.js';
import {Roles} from './resources/roles.js';
import {Clients} from './resources/clients.js';
import {Realms} from './resources/realms.js';
import {ClientScopes} from './resources/clientScopes.js';
import {ClientPolicies} from './resources/clientPolicies.js';
import {IdentityProviders} from './resources/identityProviders.js';
import {Components} from './resources/components.js';
import {AuthenticationManagement} from './resources/authenticationManagement.js';
import {ServerInfo} from './resources/serverInfo.js';
import {WhoAmI} from './resources/whoAmI.js';
import {AttackDetection} from './resources/attackDetection.js';
import type {AxiosRequestConfig} from 'axios';

import {Sessions} from './resources/sessions.js';
import {UserStorageProvider} from './resources/userStorageProvider.js';
import type {KeycloakInstance, KeycloakInitOptions, KeycloakConfig} from 'keycloak-js';

export interface ConnectionConfig {
  baseUrl?: string;
  realmName?: string;
  requestConfig?: AxiosRequestConfig;
}

export class KeycloakAdminClient {
  // Resources
  public users: Users;
  public userStorageProvider: UserStorageProvider;
  public groups: Groups;
  public roles: Roles;
  public clients: Clients;
  public realms: Realms;
  public clientScopes: ClientScopes;
  public clientPolicies: ClientPolicies;
  public identityProviders: IdentityProviders;
  public components: Components;
  public serverInfo: ServerInfo;
  public whoAmI: WhoAmI;
  public attackDetection: AttackDetection;
  public sessions: Sessions;
  public authenticationManagement: AuthenticationManagement;
  public cache: Cache;

  // Members
  public baseUrl: string;
  public realmName: string;
  public accessToken?: string;
  public refreshToken?: string;
  public keycloak?: KeycloakInstance;

  private requestConfig?: AxiosRequestConfig;

  constructor(connectionConfig?: ConnectionConfig) {
    this.baseUrl =
      (connectionConfig && connectionConfig.baseUrl) || defaultBaseUrl;
    this.realmName =
      (connectionConfig && connectionConfig.realmName) || defaultRealm;
    this.requestConfig = connectionConfig && connectionConfig.requestConfig;

    // Initialize resources
    this.users = new Users(this);
    this.userStorageProvider = new UserStorageProvider(this);
    this.groups = new Groups(this);
    this.roles = new Roles(this);
    this.clients = new Clients(this);
    this.realms = new Realms(this);
    this.clientScopes = new ClientScopes(this);
    this.clientPolicies = new ClientPolicies(this);
    this.identityProviders = new IdentityProviders(this);
    this.components = new Components(this);
    this.authenticationManagement = new AuthenticationManagement(this);
    this.serverInfo = new ServerInfo(this);
    this.whoAmI = new WhoAmI(this);
    this.sessions = new Sessions(this);
    this.attackDetection = new AttackDetection(this);
    this.cache = new Cache(this);
  }

  public async auth(credentials: Credentials) {
    const {accessToken, refreshToken} = await getToken({
      baseUrl: this.baseUrl,
      realmName: this.realmName,
      credentials,
      requestConfig: this.requestConfig,
    });
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  public async init(init?: KeycloakInitOptions, config?: KeycloakConfig) {
    if (typeof window === 'undefined') {
      return;
    }

    const Keycloak = (await import('keycloak-js')).default;
    this.keycloak = Keycloak(config);

    if (init) {
      await this.keycloak.init(init);
    }

    if (this.keycloak.authServerUrl) {
      this.baseUrl = this.keycloak.authServerUrl;
    }
  }

  public setAccessToken(token: string) {
    this.accessToken = token;
  }

  public async getAccessToken() {
    if (this.keycloak) {
      try {
        await this.keycloak.updateToken(5);
      } catch (error) {
        this.keycloak.login();
      }
      return this.keycloak.token;
    }
    return this.accessToken;
  }

  public getRequestConfig() {
    return this.requestConfig;
  }

  public setConfig(connectionConfig: ConnectionConfig) {
    if (
      typeof connectionConfig.baseUrl === 'string' &&
      connectionConfig.baseUrl
    ) {
      this.baseUrl = connectionConfig.baseUrl;
    }

    if (
      typeof connectionConfig.realmName === 'string' &&
      connectionConfig.realmName
    ) {
      this.realmName = connectionConfig.realmName;
    }
    this.requestConfig = connectionConfig.requestConfig;
  }
}
