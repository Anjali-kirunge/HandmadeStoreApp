package com.handmade.store.service;

import com.handmade.store.dto.address.AddressRequest;
import com.handmade.store.dto.address.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> getUserAddresses(String email);

    AddressResponse addAddress(String email, AddressRequest request);

    AddressResponse updateAddress(Long id, String email, AddressRequest request);

    void deleteAddress(Long id, String email);

    AddressResponse setDefaultAddress(Long id, String email);
}
