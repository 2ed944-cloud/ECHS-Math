/* ECHS Learning Sync Adapter — local-first contract for future cloud services */
(function(){
  "use strict";
  class LocalLearningAdapter{
    constructor(namespace="echs_learning_sync_v2"){this.namespace=namespace;}
    async status(){return{provider:"local",connected:true,lastSync:localStorage.getItem(`${this.namespace}:lastSync`)||null};}
    async push(payload){localStorage.setItem(`${this.namespace}:snapshot`,JSON.stringify(payload));const at=new Date().toISOString();localStorage.setItem(`${this.namespace}:lastSync`,at);return{ok:true,provider:"local",at};}
    async pull(){try{return JSON.parse(localStorage.getItem(`${this.namespace}:snapshot`)||"null");}catch{return null;}}
    async signIn(){return{ok:true,provider:"local",anonymous:true};}
    async signOut(){return{ok:true,provider:"local"};}
  }
  class DisabledCloudAdapter{
    constructor(provider){this.provider=provider;}
    async status(){return{provider:this.provider,connected:false,requiresConfiguration:true};}
    async push(){throw new Error(`${this.provider} sync is not configured.`);}
    async pull(){throw new Error(`${this.provider} sync is not configured.`);}
    async signIn(){throw new Error(`${this.provider} authentication is not configured.`);}
    async signOut(){return{ok:true,provider:this.provider};}
  }
  const config=window.ECHS_SYNC_CONFIG||{provider:"local"};
  const adapter=config.provider==="local"?new LocalLearningAdapter():new DisabledCloudAdapter(config.provider);
  window.ECHSLearningSync={adapter,LocalLearningAdapter,DisabledCloudAdapter,config};
})();