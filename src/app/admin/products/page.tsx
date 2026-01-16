"use client";

import { useEffect, useState } from "react";
import TableShell from "@/components/admin/widgets/table-shell";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import {
  adminCreateFullProduct,
  adminDeleteProduct,
  adminFetchProducts,
  adminUpdateProduct,
  adminUploadImage,
  handleApiError,
} from "@/lib/api";
import { AdminProduct } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sellPrice: "",
    costPrice: "",
    featured: "false",
    imageUrlsText: "",
    gender: "unisex",
    condition: "new",
    active: "true",
    discountEnabled: "false",
    discount: "",
    variants: [
      {
        color: "",
        priceOverride: "",
        imageUrlsText: "",
        sizes: [{ sizeUS: "", sizeEU: "", stock: "" }],
      },
    ],
  });
  const [uploadState, setUploadState] = useState({ loading: false, error: "" });

  const labelClass = "text-white/80";
  const hintClass = "text-white/60";

  useEffect(() => {
    let active = true;
    adminFetchProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((error) => {
        if (active) setStatus({ loading: false, error: handleApiError(error) });
      });
    return () => {
      active = false;
    };
  }, []);

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    setStatus({ loading: true, error: "" });
    try {
      const totalStock = form.variants.reduce((sum, variant) => {
        return (
          sum +
          variant.sizes.reduce((inner, size) => inner + Number(size.stock || 0), 0)
        );
      }, 0);

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        sellPrice: Number(form.sellPrice),
        costPrice: Number(form.costPrice),
        stock: totalStock,
        featured: form.featured === "true",
        active: form.active === "true",
        discount:
          form.discountEnabled === "true" && form.discount
            ? Number(form.discount)
            : undefined,
        images: form.imageUrlsText
          ? form.imageUrlsText
              .split(/\r?\n/)
              .map((url) => url.trim())
              .filter(Boolean)
              .map((url) => ({ url }))
          : undefined,
        gender: form.gender as "men" | "women" | "unisex",
        condition: form.condition as "new" | "used" | "refurbished",
        variants: form.variants
          .filter((variant) => variant.color.trim())
          .map((variant) => ({
            color: variant.color.trim(),
            priceOverride: variant.priceOverride
              ? Number(variant.priceOverride)
              : undefined,
            images: variant.imageUrlsText
              ? variant.imageUrlsText
                  .split(/\r?\n/)
                  .map((url) => url.trim())
                  .filter(Boolean)
                  .map((url) => ({ url }))
              : undefined,
            sizes: variant.sizes
              .filter((size) => size.stock)
              .map((size) => ({
                sizeUS: size.sizeUS?.trim() || undefined,
                sizeEU: size.sizeEU?.trim() || undefined,
                stock: Number(size.stock),
              })),
          })),
      };
      if (editingId) {
        const updated = await adminUpdateProduct(editingId, payload);
        setProducts((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await adminCreateFullProduct(payload);
        setProducts((prev) => [created, ...prev]);
      }
      setForm({
        name: "",
        slug: "",
        sellPrice: "",
        costPrice: "",
        featured: "false",
        imageUrlsText: "",
        gender: "unisex",
        condition: "new",
        active: "true",
        discountEnabled: "false",
        discount: "",
        variants: [
          {
            color: "",
            priceOverride: "",
            imageUrlsText: "",
            sizes: [{ sizeUS: "", sizeEU: "", stock: "" }],
          },
        ],
      });
      setEditingId(null);
      setStatus({ loading: false, error: "" });
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    }
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      sellPrice: product.sellPrice?.toString() ?? "",
      costPrice: product.costPrice?.toString() ?? "",
      featured: product.featured ? "true" : "false",
      imageUrlsText: product.images?.map((img) => img.url).join("\n") ?? "",
      gender: product.gender ?? "unisex",
      condition: product.condition ?? "new",
      active: product.active === false ? "false" : "true",
      discountEnabled: product.discount ? "true" : "false",
      discount: product.discount ? String(product.discount) : "",
      variants:
        product.variants?.length
          ? product.variants.map((variant) => ({
              color: variant.color,
              priceOverride: variant.priceOverride ? String(variant.priceOverride) : "",
              imageUrlsText: variant.images?.map((img) => img.url).join("\n") ?? "",
              sizes: variant.sizes?.length
                ? variant.sizes.map((size) => ({
                    sizeUS: size.sizeUS ?? "",
                    sizeEU: size.sizeEU ?? "",
                    stock: String(size.stock),
                  }))
                : [{ sizeUS: "", sizeEU: "", stock: "" }],
            }))
          : [
              {
                color: "",
                priceOverride: "",
                imageUrlsText: "",
                sizes: [{ sizeUS: "", sizeEU: "", stock: "" }],
              },
            ],
    });
  };

  const handleDelete = async (productId: string) => {
    const ok = window.confirm("Delete this product? This cannot be undone.");
    if (!ok) return;
    try {
      await adminDeleteProduct(productId);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
    } catch (error) {
      setStatus({ loading: false, error: handleApiError(error) });
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    setUploadState({ loading: true, error: "" });
    try {
      const uploaded = await adminUploadImage(file);
      setForm((prev) => ({ ...prev, imageUrlsText: prev.imageUrlsText ? `${prev.imageUrlsText}
${uploaded.url}` : uploaded.url }));
      setUploadState({ loading: false, error: "" });
    } catch (error) {
      setUploadState({ loading: false, error: handleApiError(error) });
    }
  };

  const handleVariantUpload = async (variantIndex: number, file?: File) => {
    if (!file) return;
    setUploadState({ loading: true, error: "" });
    try {
      const uploaded = await adminUploadImage(file);
      setForm((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, idx) =>
          idx === variantIndex ? { ...variant, imageUrlsText: variant.imageUrlsText ? `${variant.imageUrlsText}
${uploaded.url}` : uploaded.url } : variant,
        ),
      }));
      setUploadState({ loading: false, error: "" });
    } catch (error) {
      setUploadState({ loading: false, error: handleApiError(error) });
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading tone="dark"
        eyebrow="Catalog"
        title="Products"
        description="Add and manage products with cost and selling price."
      />

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <p className="text-sm font-semibold">Add product</p>
          <div className="mt-4 space-y-3">
            <Input
              label="Name"
              labelClassName={labelClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Slug"
              labelClassName={labelClass}
              hint="Use lowercase and hyphens, e.g. nike-air-force"
              hintClassName={hintClass}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <Input
              label="Selling price"
              type="number"
              labelClassName={labelClass}
              value={form.sellPrice}
              onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
            />
            <Input
              label="Cost price"
              type="number"
              labelClassName={labelClass}
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <span className={labelClass}>Discount</span>
              <select
                className="rounded-lg border border-white/20 bg-white text-sm text-gray-900 px-3 py-2"
                value={form.discountEnabled}
                onChange={(e) => setForm({ ...form, discountEnabled: e.target.value })}
              >
                <option value="false" className="text-gray-900">
                  Off
                </option>
                <option value="true" className="text-gray-900">
                  On
                </option>
              </select>
            </div>
            {form.discountEnabled === "true" && (
              <Input
                label="Discount percent"
                type="number"
                labelClassName={labelClass}
                hint="0 to 90"
                hintClassName={hintClass}
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            )}
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <span className={labelClass}>Image URLs (one per line)</span>
              <textarea
                className="min-h-[96px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none"
                value={form.imageUrlsText}
                onChange={(e) => setForm({ ...form, imageUrlsText: e.target.value })}
              />
              <span className={hintClass}>
                You can paste multiple URLs. Upload adds here automatically.
              </span>
            </div>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <span className={labelClass}>Upload image</span>
              <input
                type="file"
                accept="image/*"
                className="rounded-lg border border-white/20 bg-white/90 px-3 py-2 text-sm text-gray-900"
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />
              {uploadState.loading && <span className={hintClass}>Uploading...</span>}
              {uploadState.error && (
                <span className="text-xs text-rose-300">{uploadState.error}</span>
              )}
              {form.imageUrlsText && (
                <span className={hintClass}>Uploaded: {form.imageUrlsText.split(/\r?\n/)[0]}</span>
              )}
            </div>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Variants</p>
              {form.variants.map((variant, variantIndex) => (
                <div
                  key={`variant-${variantIndex}`}
                  className="space-y-3 rounded-2xl border border-white/10 bg-[#0c142a] p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                      Color variant {variantIndex + 1}
                    </p>
                    {form.variants.length > 1 && (
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            variants: prev.variants.filter((_, idx) => idx !== variantIndex),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Input
                    label="Color"
                    labelClassName={labelClass}
                    value={variant.color}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        variants: prev.variants.map((item, idx) =>
                          idx === variantIndex ? { ...item, color: e.target.value } : item,
                        ),
                      }))
                    }
                  />
                  <Input
                    label="Price override (optional)"
                    labelClassName={labelClass}
                    type="number"
                    value={variant.priceOverride}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        variants: prev.variants.map((item, idx) =>
                          idx === variantIndex ? { ...item, priceOverride: e.target.value } : item,
                        ),
                      }))
                    }
                  />
                  <div className="flex flex-col gap-2 text-sm text-white/80">
                    <span className={labelClass}>Variant image URLs (one per line)</span>
                    <textarea
                      className="min-h-[88px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-[0_12px_40px_rgba(12,22,44,0.06)] outline-none"
                      value={variant.imageUrlsText}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          variants: prev.variants.map((item, idx) =>
                            idx === variantIndex
                              ? { ...item, imageUrlsText: e.target.value }
                              : item,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-white/80">
                    <span className={labelClass}>Upload variant image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="rounded-lg border border-white/20 bg-white/90 px-3 py-2 text-sm text-gray-900"
                      onChange={(e) =>
                        handleVariantUpload(variantIndex, e.target.files?.[0])
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white/80">Sizes + stock</p>
                    <div className="grid gap-2">
                      {variant.sizes.map((size, sizeIndex) => (
                        <div
                          key={`variant-${variantIndex}-size-${sizeIndex}`}
                          className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"
                        >
                          <Input
                            label="US"
                            labelClassName={labelClass}
                            value={size.sizeUS}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                variants: prev.variants.map((item, idx) =>
                                  idx === variantIndex
                                    ? {
                                        ...item,
                                        sizes: item.sizes.map((s, sIdx) =>
                                          sIdx === sizeIndex
                                            ? { ...s, sizeUS: e.target.value }
                                            : s,
                                        ),
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                          <Input
                            label="EU"
                            labelClassName={labelClass}
                            value={size.sizeEU}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                variants: prev.variants.map((item, idx) =>
                                  idx === variantIndex
                                    ? {
                                        ...item,
                                        sizes: item.sizes.map((s, sIdx) =>
                                          sIdx === sizeIndex
                                            ? { ...s, sizeEU: e.target.value }
                                            : s,
                                        ),
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                          <Input
                            label="Stock"
                            labelClassName={labelClass}
                            type="number"
                            value={size.stock}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                variants: prev.variants.map((item, idx) =>
                                  idx === variantIndex
                                    ? {
                                        ...item,
                                        sizes: item.sizes.map((s, sIdx) =>
                                          sIdx === sizeIndex
                                            ? { ...s, stock: e.target.value }
                                            : s,
                                        ),
                                      }
                                    : item,
                                ),
                              }))
                            }
                          />
                          <div className="flex items-end">
                            {variant.sizes.length > 1 && (
                              <Button
                                variant="ghost"
                                className="text-xs"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    variants: prev.variants.map((item, idx) =>
                                      idx === variantIndex
                                        ? {
                                            ...item,
                                            sizes: item.sizes.filter((_, sIdx) => sIdx !== sizeIndex),
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          variants: prev.variants.map((item, idx) =>
                            idx === variantIndex
                              ? {
                                  ...item,
                                  sizes: [...item.sizes, { sizeUS: "", sizeEU: "", stock: "" }],
                                }
                              : item,
                          ),
                        }))
                      }
                    >
                      Add size row
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    variants: [
                      ...prev.variants,
                      { color: "", priceOverride: "", imageUrlsText: "", sizes: [{ sizeUS: "", sizeEU: "", stock: "" }] },
                    ],
                  }))
                }
              >
                Add color variant
              </Button>
            </div>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <span className={labelClass}>Gender</span>
              <select
                className="rounded-lg border border-white/20 bg-white text-sm text-gray-900 px-3 py-2"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                {["men", "women", "unisex"].map((option) => (
                  <option key={option} value={option} className="text-gray-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <span className={labelClass}>Condition</span>
              <select
                className="rounded-lg border border-white/20 bg-white text-sm text-gray-900 px-3 py-2"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
              >
                {["new", "used", "refurbished"].map((option) => (
                  <option key={option} value={option} className="text-gray-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <span className={labelClass}>Featured</span>
              <select
                className="rounded-lg border border-white/20 bg-white text-sm text-gray-900 px-3 py-2"
                value={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.value })}
              >
                <option value="true" className="text-gray-900">
                  Yes
                </option>
                <option value="false" className="text-gray-900">
                  No
                </option>
              </select>
            </div>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <span className={labelClass}>Visible to customers</span>
              <select
                className="rounded-lg border border-white/20 bg-white text-sm text-gray-900 px-3 py-2"
                value={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.value })}
              >
                <option value="true" className="text-gray-900">
                  On
                </option>
                <option value="false" className="text-gray-900">
                  Off
                </option>
              </select>
            </div>
            {status.error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {status.error}
              </div>
            )}
            <Button
              variant="primary"
              full
              disabled={status.loading || !form.name || !form.slug}
              onClick={handleSubmit}
            >
              {status.loading
                ? "Saving..."
                : editingId
                  ? "Update product"
                  : "Save product"}
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                full
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    name: "",
                    slug: "",
                    sellPrice: "",
                    costPrice: "",
                    featured: "false",
                    imageUrlsText: "",
                    gender: "unisex",
                    condition: "new",
                    active: "true",
                    discountEnabled: "false",
                    discount: "",
                    variants: [
                      {
                        color: "",
                        priceOverride: "",
                        imageUrlsText: "",
                        sizes: [{ sizeUS: "", sizeEU: "", stock: "" }],
                      },
                    ],
                  });
                }}
              >
                Cancel edit
              </Button>
            )}
          </div>
        </div>

        <TableShell
          title="Catalog"
          headers={[
            "Product",
            "Sell price",
            "Cost price",
            "Stock",
            "Variants",
            "Visible",
            "Actions",
          ]}
        >
          {products.map((p) => (
            <tr key={p.id} className="text-sm text-white/80">
              <td className="py-3">{p.name}</td>
              <td>{formatCurrency(p.sellPrice)}</td>
              <td>{formatCurrency(p.costPrice)}</td>
              <td>{p.stock}</td>
              <td>{p.variants?.length ?? 0}</td>
              <td>{p.active === false ? "Off" : "On"}</td>
              <td className="space-x-2">
                <Button variant="ghost" className="text-xs" onClick={() => handleEdit(p)}>
                  Edit
                </Button>
                <Button variant="ghost" className="text-xs" onClick={() => handleDelete(p.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>
    </div>
  );
}

