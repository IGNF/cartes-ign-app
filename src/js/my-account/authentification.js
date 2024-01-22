class Auth {

     /**
   * constructeur
   * @constructs
   */
  constructor() {
    this.urlKeycloak = "https://sso.geopf.fr/realms/geoplateforme/protocol/openid-connect/token";
    this.accessToken = "";

    this.urlParams = {
        grant_type: "password",
        scope: "openid",
        client_id: `${process.env.client_id_user}`,
        client_secret: `${process.env.client_secret_user}`
    }

    this.urlParamsAdmin= {
      grant_type: "client_credentials",
      scope: "openid",
      client_id: `${process.env.client_id_admin}`,
      client_secret: `${process.env.client_secret_admin}`,
      username: "",
      password: ""
  }

    document.getElementById("logInButton").addEventListener('click', () => {
        this.urlParamsAdmin.password = document.getElementById('password').value;
        this.urlParamsAdmin.username = document.getElementById('username').value;
        fetch(this.urlKeycloak, {
            method:"POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(this.urlParamsAdmin).toString()
        })
        .then(res => console.log(res));
      });
    return this;
  }
}

export default Auth;