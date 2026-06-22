export class UsuarioDTO{
    constructor(usuario){
        this._id = usuario._id;
        this.nombre_completo = `${usuario.first_name} ${usuario.last_name}`;
        this.first_name = usuario.first_name;
        this.last_name = usuario.last_name;
        this.email = usuario.email;
        this.rol = usuario.role;
    }

    static fromObject(usuarioObj){
        return new UsuarioDTO(usuarioObj);
    }

    static fromArray (usuarios){
        return usuarios.map(usuario => UsuarioDTO.fromObject(usuario))
    }
}