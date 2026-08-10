package com.handmade.store.controller;

import com.handmade.store.dto.address.AddressRequest;
import com.handmade.store.dto.address.AddressResponse;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.AddressService;
import com.handmade.store.util.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@CrossOrigin(origins = "http://localhost:5173")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public ResponseEntity<List<AddressResponse>> getAddresses(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(addressService.getUserAddresses(currentUser.getUsername()));
    }

    @PostMapping
    public ResponseEntity<AddressResponse> addAddress(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(addressService.addAddress(currentUser.getUsername(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid AddressRequest request) {
        return ResponseEntity.ok(addressService.updateAddress(id, currentUser.getUsername(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<java.util.Map<String, Object>> deleteAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        addressService.deleteAddress(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<java.util.Map<String, Object>> setDefaultAddress(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        addressService.setDefaultAddress(id, currentUser.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Default address updated"));
    }
}
