import type { Model, ModelDefined, WhereOptions, Transaction } from 'sequelize'

/**
 * Repository base para models de tenancy 'tenant' (ADR 001).
 * O escopo NÃO é aplicado aqui — os hooks centrais fazem isso a partir do
 * RequestContext. Este base existe para (1) impedir que services toquem
 * models e (2) padronizar a superfície de acesso (sem agregações diretas).
 * Repositories de dados de centro NUNCA aceitam tenantId como parâmetro.
 */
export abstract class TenantRepository<A extends object, C extends object> {
  protected abstract model: ModelDefined<A, C>

  findAll(where?: WhereOptions<A>, transaction?: Transaction): Promise<Model<A, C>[]> {
    return this.model.findAll({ ...(where ? { where } : {}), ...(transaction ? { transaction } : {}) })
  }

  findById(id: number, transaction?: Transaction): Promise<Model<A, C> | null> {
    return this.model.findOne({
      where: { id } as unknown as WhereOptions<A>,
      ...(transaction ? { transaction } : {}),
    })
  }

  create(data: C, transaction?: Transaction): Promise<Model<A, C>> {
    return this.model.create(data as never, transaction ? { transaction } : undefined)
  }

  bulkCreate(rows: C[], transaction?: Transaction): Promise<Model<A, C>[]> {
    return this.model.bulkCreate(rows as never[], transaction ? { transaction } : undefined)
  }

  async updateById(id: number, patch: Partial<A>, transaction?: Transaction): Promise<number> {
    const [n] = await this.model.update(patch, {
      where: { id } as unknown as WhereOptions<A>,
      ...(transaction ? { transaction } : {}),
    })
    return n
  }

  async destroyById(id: number, transaction?: Transaction): Promise<number> {
    return this.model.destroy({
      where: { id } as unknown as WhereOptions<A>,
      ...(transaction ? { transaction } : {}),
    })
  }
}
