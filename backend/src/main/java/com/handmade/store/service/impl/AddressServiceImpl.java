package com.handmade.store.service.impl;

import com.handmade.store.dto.address.AddressRequest;
import com.handmade.store.dto.address.AddressResponse;
import com.handmade.store.entity.Address;
import com.handmade.store.entity.User;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.AddressRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressServiceImpl(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<AddressResponse> getUserAddresses(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return addressRepository.findByUserId(user.getId()).stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse addAddress(String email, AddressRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (request.isDefault()) {
            unsetAllDefaults(user.getId());
        }

        Address address = Address.builder()
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .country(request.getCountry())
                .isDefault(request.isDefault())
                .user(user)
                .build();

        address = addressRepository.save(address);
        return mapToAddressResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long id, String email, AddressRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Address", "id", id);
        }

        if (request.isDefault() && !address.isDefault()) {
            unsetAllDefaults(user.getId());
        }

        address.setStreet(request.getStreet());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setZipCode(request.getZipCode());
        address.setCountry(request.getCountry());
        address.setDefault(request.isDefault());

        address = addressRepository.save(address);
        return mapToAddressResponse(address);
    }

    @Override
    @Transactional
    public void deleteAddress(Long id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Address", "id", id);
        }

        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Long id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", id));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Address", "id", id);
        }

        unsetAllDefaults(user.getId());

        address.setDefault(true);
        address = addressRepository.save(address);
        return mapToAddressResponse(address);
    }

    private void unsetAllDefaults(Long userId) {
        List<Address> addresses = addressRepository.findByUserId(userId);
        for (Address addr : addresses) {
            if (addr.isDefault()) {
                addr.setDefault(false);
                addressRepository.save(addr);
            }
        }
    }

    private AddressResponse mapToAddressResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .street(address.getStreet())
                .city(address.getCity())
                .state(address.getState())
                .zipCode(address.getZipCode())
                .country(address.getCountry())
                .isDefault(address.isDefault())
                .createdAt(address.getCreatedAt())
                .build();
    }
}
