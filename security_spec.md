# Security Specification for Lunivo

## Data Invariants
1. A user can only read their own profile and private data.
2. Orders can only be created by authenticated users and read by the creator or admins.
3. Reviews can only be created by authenticated users.
4. Product stock can only be modified by admins.
5. Coupons can only be read/validated by authenticated users but only created/modified by admins.
6. Admin status is determined by a record in the `/admins/` collection.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Privilege Escalation**: Attempt to set `role: 'admin'` on own user doc.
3. **Ghost Review**: Attempt to post a review as another user.
4. **Order Hijacking**: Attempt to read another user's order.
5. **Stock Manipulation**: Attempt to change product inventory as a customer.
6. **Coupon Fraud**: Attempt to create a 100% discount coupon as a customer.
7. **Negative Price**: Attempt to create a product with a negative price (if guest creation was possible).
8. **Shadow Field**: Attempt to add `isVerified: true` to a profile update.
9. **Invalid ID**: Injecting a 1MB string as a document ID.
10. **Orphaned Order**: Creating an order for a product ID that doesn't exist.
11. **PII Leak**: A guest trying to list all user profiles.
12. **Status Shortcut**: A user trying to set an order status to 'delivered' prematurely.
