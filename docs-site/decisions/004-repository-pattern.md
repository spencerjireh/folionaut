---
title: "ADR-004: Repository Pattern"
description: Abstract data access for testability and flexibility
---

# ADR 004: Repository Pattern for Data Access

## Status

<Badge type="tip" text="Accepted" />

## Context

Folionaut needs to:
- Access data from Turso/libSQL database
- Support potential database migration in the future
- Enable unit testing without database dependencies
- Provide consistent data access patterns
- Handle soft deletes and versioning

Requirements:
- Type-safe queries with TypeScript
- Abstraction over Drizzle ORM specifics
- Support for complex queries (filtering, pagination)
- Transaction support for multi-table operations

## Decision

Implement the **Repository Pattern** to abstract data access, with Drizzle ORM as the underlying query builder.

```typescript
interface Repository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<T | null>
  findMany(filter: FilterOptions): Promise<PaginatedResult<T>>
  create(data: CreateDTO): Promise<T>
  update(id: string, data: UpdateDTO): Promise<T>
  delete(id: string): Promise<void>
}

// Content-specific repository
interface ContentRepository extends Repository<Content, CreateContent, UpdateContent> {
  findBySlug(slug: string): Promise<Content | null>
  findByType(type: ContentType): Promise<Content[]>
  findPublished(): Promise<Content[]>
  getHistory(id: string): Promise<ContentVersion[]>
  restore(id: string, version: number): Promise<Content>
}
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Direct Drizzle calls** | Simple, no abstraction | Scattered queries, hard to test |
| **Active Record pattern** | ORM-style, entities have methods | Tight coupling, heavy objects |
| **Query Builder service** | Centralized, composable | Not as clean an interface |
| **Repository Pattern** | Clean interface, testable, swappable | More code, potential over-abstraction |
| **CQRS** | Optimized reads/writes | Overkill for this scale |

## Consequences

### Positive

- **Testability**: Mock repositories in unit tests
- **Single Responsibility**: Data access logic centralized
- **Type Safety**: Strong typing at repository boundary
- **Flexibility**: Can swap database implementations
- **Consistency**: Standard patterns across all entities
- **Soft delete handling**: Repositories automatically filter deleted records

### Negative

- **More code**: Repository interfaces + implementations
- **Indirection**: One more layer to navigate
- **Learning curve**: Team must understand the pattern

### Mitigations

- **Keep it simple**: Don't over-abstract, only what's needed
- **Base class**: Share common CRUD logic
- **Clear naming**: Repository methods describe business operations

## References

- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
