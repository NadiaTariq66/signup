class UserLoginDTO{
    constructor(user){
        this.email = user.email;
        this.password = user.password;
    }
}

module.exports = UserLoginDTO;