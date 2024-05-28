class Auth {

    /**
  * constructeur
  * @constructs
  */
 constructor() {
   this.urlKeycloak = "https://sso.geopf.fr/realms/geoplateforme/protocol/openid-connect/token";
   this.urlUserMe = "https://data.geopf.fr/api/users/me";
   this.accessToken = "";

   this.urlParams = {
       grant_type: "password",
       scope: "openid",
       client_id: `${process.env.client_id_user}`,
       client_secret: `${process.env.client_secret_user}`,
       username: "",
       password: ""
   }

   document.getElementById("logInButton").addEventListener('click', () => {
      this.urlParams.username = `${process.env.user}`;
      this.urlParams.password =`${process.env.pwd}`;

      console.log(this.urlParams)
       fetch(this.urlKeycloak, {
           method:"POST",
           headers: {
               "Content-Type": "application/x-www-form-urlencoded",
           },
           body: new URLSearchParams(this.urlParams).toString()
       })
       .then((res) => {return res.json()})
       .then(json => {
          this.accessToken = json.access_token;
          fetch(this.urlUserMe, {
            method:"GET",
            headers: {
              "Accept": "*/*",
              Authorization: `Bearer ${this.accessToken}`
            },
          })
          .then((res) => {
            return res.json()
          })
          .then(json => {
            console.log(json)})
          .catch(err => console.error(err))
        })        
    //  });
    });
   return this;
 }
}

export default Auth;