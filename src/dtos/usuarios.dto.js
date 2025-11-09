export class UsuarioDTO{
    constructor(usuario){
        this.nombre_completo = `${usuario.first_name} ${usuario.last_name}`;
        this.email = usuario.email;
        this.rol = usuario.role;
        // this._id = usuario._id;
        
    }

    static fromObject(usuarioObj){
        return new UsuarioDTO(usuarioObj);
    }

    static fromArray (usuarios){
        return usuarios.map(usuario => UsuarioDTO.fromObject(usuario))
    }
}