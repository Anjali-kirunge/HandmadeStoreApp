package com.handmade.store.enums;

import org.springframework.security.core.GrantedAuthority;

public enum Role implements GrantedAuthority {

    ROLE_CUSTOMER,
    ROLE_SELLER,
    ROLE_ADMIN;

    @Override
    public String getAuthority() {
        return name();
    }
}
