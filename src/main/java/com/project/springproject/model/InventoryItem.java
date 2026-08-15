package com.project.springproject.model;

import jakarta.persistence.*;

@Entity
@Table(name = "inventory_items")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String itemName;

    private String category; // Food & Water, Medical, Blood, Oxygen, Shelter

    private Integer quantity;

    private String unit; // kg, Liters, Units, Packets, Cylinders

    private Integer minThreshold; // Low stock alert threshold

    private String location;

    private String status; // NORMAL, LOW_STOCK, CRITICAL

    public InventoryItem() {}

    public InventoryItem(String itemName, String category, Integer quantity, String unit, Integer minThreshold, String location) {
        this.itemName = itemName;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minThreshold = minThreshold;
        this.location = location;
        this.status = (quantity != null && minThreshold != null && quantity <= minThreshold) ? "LOW_STOCK" : "NORMAL";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        if (this.quantity != null && this.minThreshold != null) {
            this.status = this.quantity <= this.minThreshold ? "LOW_STOCK" : "NORMAL";
        }
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Integer getMinThreshold() {
        return minThreshold;
    }

    public void setMinThreshold(Integer minThreshold) {
        this.minThreshold = minThreshold;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
